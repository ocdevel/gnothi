import {DB} from '../db'
import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {entries_list_response} from '@gnothi/schemas/entries'
import {eq, and, or, not, inArray, lt, asc, desc} from 'drizzle-orm'
import {sql, SQL} from "drizzle-orm"
import {entries, Entry} from '../schemas/entries'
import {entriesTags} from '../schemas/entriesTags'
import {FnContext} from "../../routes/types";
import _ from 'lodash'

type Snoop = {
  sid: string
  entry_id?: string
  group_id?: string
  order_by?: SQL
  tags?: string[]
  days?: number
  for_ai?: boolean
}

function tagsToBoolMap(tags: any): Record<string, boolean> {
  // comes in from json_agg, field returned as JSON string
  return Object.fromEntries(tags.map(({tag_id}) => [tag_id, true]))
}

export class Entries extends Base {
  async getByIds(ids: string[]) {
    const {db, vid} = this.context
    if (!ids.length) return []
    return db.drizzle.select().from(entries)
      .where(and(inArray(entries.id, ids), eq(entries.user_id, vid)))
      .orderBy(asc(entries.created_at))
  }

  async filter(req: S.Entries.entries_list_request): Promise<entries_list_response[]> {
    const {user, uid, db} = this.context
    const {tags, startDate, endDate} = req
    const tids = boolMapToKeys(tags)

    // TODO how to handle this with good UX?
    if (!tids.length) {
      // throw new GnothiError({key: "NO_TAGS"})
      return []
    }

    const startDate_ = startDate ||
      dayjs().subtract(user.filter_days, "day").format('YYYY-MM-DD')

    // TODO adding 2 days for good measure. Need to use with_tz instead in query
    const endDate_ = endDate || dayjs().add(2, "day").format('YYYY-MM-DD')

    type EntriesSQL = Entry & { tags: string[] }
    const rows = await db.query<EntriesSQL>(sql`
      select e.*,
          json_agg(et.*) as tags
      from ${entries} e
        inner join ${entriesTags} et on e.id = et.entry_id
      where e.user_id = ${uid}
        and e.created_at > ${startDate_}::date
        and e.created_at <= ${endDate_}::date
        and et.tag_id in ${tids}
      group by e.id
      order by e.created_at desc;
    `)
    // TODO update SQL to do this conversion, we'll use it elsewhere
    return rows.map(row => ({...row, tags: tagsToBoolMap(row.tags)}))
  }

  async destroy(id: string) {
    const {uid, db} = this.context
    const res = await db.drizzle.delete(entries)
      .where(and(eq(entries.id, id), eq(entries.user_id, uid)))
      // .returning()
    // I can't think of why we'd return the full deleted-entry, so just returning ID for now
    return [{id}]
  }

  async snoop({sid, entry_id, group_id, order_by, tags, days, for_ai}: Snoop): Promise<Entry[]> {
    const {s, db, snooping, vid} = this.context
    const {drizzle} = db

    let q;

    if (snooping) {
      q = drizzle.select().from(s.entries)
        .innerJoin(s.entriesTags, eq(s.entriesTags.entry_id, s.entries.id))
        .innerJoin(s.sharesTags, eq(s.sharesTags.tag_id, s.entriesTags.tag_id))
        .innerJoin(s.shares, eq(s.shares.id, s.sharesTags.share_id))
        .innerJoin(s.sharesUsers, eq(s.sharesUsers.share_id, s.shares.id))
        .where(and(
          eq(s.sharesUsers.obj_id, vid),
          eq(s.shares.user_id, sid)
        ))
    // } else if (group_id) {
    //   q = db.query(Entry)
    //     .join(EntryTag)
    //     .join(ShareTag, ShareTag.tag_id == EntryTag.tag_id)
    //     .join(ShareGroup, sa.and_(
    //       ShareGroup.share_id == ShareTag.share_id,
    //       ShareGroup.obj_id == group_id
    //     ))
    //     .join(UserGroup, sa.and_(
    //       UserGroup.group_id == ShareGroup.obj_id,
    //       UserGroup.user_id == vid
    //     ));
    } else {
      q = drizzle.select().from(s.entries).where(eq(s.entries.user_id, vid))
    }

    if (entry_id) {
      q = q.where(eq(s.entries.id, entry_id))
    }

    if (for_ai) {
      // q = q.filter(Entry.no_ai.isnot(True));
      q = q.where(not(eq(s.entries.no_ai, true)))
    }

    if (tags) {
      if (!snooping) {
        q = q.innerJoin(s.entriesTags, eq(s.entries.id, s.entriesTags.entry_id))
          .innerJoin(s.tags, eq(s.entriesTags.tag_id, s.tags.id))
      }
      q = q.where(inArray(s.entriesTags.tag_id, tags))
    }

    if (days) {
      const now = new Date();
      const x_days = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      q = q.where(lt(s.entries.created_at, x_days))
      order_by = asc(s.entries.created_at)
    }

    if (!order_by) {
      order_by = desc(s.entries.created_at);
    }
    return q.order_by(order_by);
  }

  async upsertOuter(
    req: S.Entries.entries_post_request,
    upsertInner: (entry: Entry) => Promise<Entry>
  ): Promise<S.Entries.entries_upsert_response[]> {
    const {db, uid} = this.context
    const driz = db.drizzle
    const {tags, ...entry} = req
    const tids = boolMapToKeys(tags)
    if (!tids.length) {
      throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
    }
    const updates: Entry = {
      ...entry,
      ai_index_state: "running",
      updated_at: new Date(),
      user_id: uid
    }
    const dbEntry = await upsertInner(updates)
    const entry_id = dbEntry.id

    // custom created_at override is handled on the client-side with dirty-field checking against
    // the datePicker & dateTextField (submit undefined if not dirty)

    await driz.insert(entriesTags)
        .values(tids.map(tag_id => ({tag_id, entry_id})))

    // fixme gotta find a way to not need removeNull everywhere
    const ret = DB.removeNull({...dbEntry, tags})
    return [ret]
  }

  async put(req: S.Entries.entries_put_request) {
    const {id} = req
    const {db, uid} = this.context
    const {drizzle} = db
    // Note: removal of non-editable fields handled via Zod beforehand
    return this.upsertOuter(req, async (updates) => {
      // await drizzle.delete(entriesTags)
      //   .where(and(
      //     eq(entriesTags.entry_id, id),
      //     // FIXME insecure. x-ref user-id with inner join. Need a CTE for user_id
      //     // eq(entriesTags.user_id, user_id)
      //   ))
      await drizzle.execute(sql`
        delete from ${entriesTags}
        where ${entriesTags.entry_id} in (
          select ${entries.id} from ${entries} 
          where ${entries.id}=${id} and ${entries.user_id}=${uid}
        )
      `)

      const res = await drizzle.update(entries)
        .set(updates)
        .where(and(eq(entries.id, id), eq(entries.user_id, uid)))
        .returning()
      return res[0]
    })
  }

  async post(req: S.Entries.entries_post_request) {
    const {db} = this.context
    const {drizzle} = db
    return this.upsertOuter(req, async (entry) => {
      const res = await drizzle.insert(entries).values(entry).returning()
      return res[0]
    })
  }

  async getStuckEntry(user_id: string): Promise<S.Entries.entries_upsert_response | null> {
    const {db} = this.context
    const res = await db.drizzle.execute<S.Entries.entries_upsert_response>(sql`
      WITH updated AS (
        UPDATE entries
        SET 
          ai_index_state = CASE WHEN ai_index_state = 'todo' THEN 'running' ELSE ai_index_state END,
          ai_summarize_state = CASE WHEN ai_summarize_state = 'todo' THEN 'running' ELSE ai_summarize_state END
        WHERE 
          id = (
            SELECT id FROM entries
            WHERE
              user_id = ${user_id} 
              AND (
                (ai_index_state = 'todo' OR ai_summarize_state = 'todo')
                OR (
                  (ai_index_state = 'running' OR ai_summarize_state = 'running')
                  AND updated_at < (NOW() - INTERVAL '5 minutes')
                )
              )
            ORDER BY created_at DESC
            LIMIT 1
          )
        RETURNING *
      )
      SELECT e.*, (SELECT json_agg(et.*) FROM entries_tags et WHERE e.id = et.entry_id) as tags
      FROM updated e;
    `)
    if (!res.rows?.[0]) {return null}
    const row = DB.removeNull(res.rows[0]) as S.Entries.entries_upsert_response
    return {...row, tags: tagsToBoolMap(row.tags)}
  }
}
