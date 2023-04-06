import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {db} from "../dbSingleton";
import {entries_list_response} from '@gnothi/schemas/entries'
import {eq, and, or, not, inArray, lt, asc, desc} from 'drizzle-orm/pg-core/expressions'
import {sql, SQL} from "drizzle-orm/sql"
import {entries, Entry} from '../schemas/entries'
import {entriesTags} from '../schemas/entriesTags'
import {InferModel} from "drizzle-orm/pg-core";

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
    return db.query<entries_list_response>(
      sql`select * from ${entries} where id in ${ids} and user_id = ${this.context.vid}`
    )
  }

  async filter(req: S.Entries.entries_list_request): Promise<entries_list_response[]> {
    const {uid} = this.context
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
    const {uid} = this.context
    return await db.queryFirst<entries_list_response>(
      sql`delete from ${entries} where id=${id} and user_id=${uid} returning *`
    )
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
      q = q.where(not(sql`${s.entries.no_ai}=true`))
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
}
