import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {entries_list_response} from '@gnothi/schemas/entries'
import {eq, and, or, not, inArray, lt, asc, desc} from 'drizzle-orm/pg-core/expressions'
import {sql, SQL} from "drizzle-orm/sql"
import {entries, Entry} from '../schemas/entries'
import {entriesTags} from '../schemas/entriesTags'
import {FnContext} from "../../routes/types";

type Snoop = {
  sid: string
  entry_id?: string
  group_id?: string
  order_by?: SQL
  tags?: string[]
  days?: number
  for_ai?: boolean
}

type EntriesListSQL = Omit<entries_list_response, 'tags'> & {
  // comes as json string
  tags: string // Array<S.Tags.Tag>
}

function tagsToBoolMap(tags: any): Record<string, boolean> {
  // comes in from json_agg, field returned as JSON string
  return Object.fromEntries(tags.map(({tag_id}) => [tag_id, true]))
}

export class Entries extends Base {
  async getByIds(ids: string[]) {
    const {db, vid} = this.context
    return db.drizzle.select().from(entries)
      .where(and(inArray(entries.id, ids), eq(entries.user_id, vid)))
  }

  async filter(req: S.Entries.entries_list_request): Promise<entries_list_response[]> {
    const {uid, db} = this.context
    const {tags, startDate, endDate} = req
    const tids = boolMapToKeys(tags)

    // TODO how to handle this with good UX?
    if (!tids.length) {
      // throw new GnothiError({key: "NO_TAGS"})
      return []
    }

    // TODO adding 2 days for good measure; really should be 1 day + timezone
    const endDate_ = (endDate === "now" || !endDate)
      ? dayjs().add(2, "day").format('YYYY-MM-DD')
      : endDate

    const rows = await db.query<EntriesListSQL>(sql`
      select e.*,
          json_agg(et.*) as tags
      from ${entries} e
             inner join ${entriesTags} et on e.id = et.entry_id
      where e.user_id = ${uid}
        and e.created_at > ${startDate}::date
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
    const res = await db.delete().from(entries)
      .where(and(eq(entries.id, id), eq(entries.user_id, uid)))
      .returning()
    return res[0]
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
    const {tags, ...entry} = req
    const tids = boolMapToKeys(tags)
    if (!tids.length) {
      throw new GnothiError({message: "Each entry must belong to at least one journal", key: "NO_TAGS"})
    }
    const dbEntry = await upsertInner({...entry, user_id: uid})
    const entry_id = dbEntry.id

    // FIXME
    // manual created-at override
    // iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
    // created_at = data.get('created_at', None)
    // if created_at and re.match(iso_fmt, created_at):
    //     tz = M.User.tz(db, vid)
    //     db.execute(text("""
    //     update entries set created_at=(:day ::timestamp at time zone :tz)
    //     where id=:id
    //     """), dict(day=created_at, tz=tz, id=entry.id))
    //     db.commit()

    await db.drizzle.insert(entriesTags)
      .values(tids.map(tag_id => ({tag_id, entry_id})))
    // fixme gotta find a way to not need removeNull everywhere
    const ret = db.removeNull({...dbEntry, tags})
    return [ret]
  }

  async put(req: entries_put_request) {
    const {id} = req
    const {drizzle} = this.context.db
    return this.upsertOuter(req, async ({title, text, user_id}) => {
      await db.drizzle.delete().from(entriesTags)
        .where(and(
          eq(entriesTags.entry_id, id),
          // FIXME insecure. x-ref user-id with inner join. Need a CTE for user_id
          // eq(entriesTags.user_id, user_id)
        ))
      const res = await db.drizzle.update(entries)
        .set({title, text})
        .where(and(eq(entries.id, id), eq(entries.user_id, user_id)))
        .returning()
      return res[0]
    })
  }

  async post(req: entries_post_request) {
    const {drizzle} = this.context.db
    return this.upsertOuter(req, async (entry) => {
      const res = await drizzle.insert(entries).values(entry).returning()
      return res[0]
    })
  }
}
