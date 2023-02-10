import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {db} from "../db";
import {entries_list_response} from '@gnothi/schemas/entries'

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
      `select * from entries where id = any($1) and user_id = $2`,
      [ids, this.uid]
    )
  }

  async filter(req: S.Entries.entries_list_request): Promise<entries_list_response[]> {
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

    const rows = await db.query<EntriesListSQL>(`
      select e.*,
          json_agg(et.*) as tags
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = $1
        and e.created_at > $2::date
        and e.created_at <= $3::date
        and et.tag_id = any($4)
      group by e.id
      order by e.created_at desc;
    `, [
      this.uid,
      startDate,
      endDate_,
      tids
    ])
    // TODO update SQL to do this conversion, we'll use it elsewhere
    return rows.map(row => ({...row, tags: tagsToBoolMap(row.tags)}))
  }

  async destroy(id: string) {
    return await db.queryFirst<entries_list_response>(
      `delete from entries where id=$1 and user_id=$2 returning *`,
      [id, this.uid]
    )
  }
}
