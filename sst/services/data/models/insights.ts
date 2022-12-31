import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'
import {GnothiError} from "../../routes/errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";

export class Insights extends Base {
  async facetFilter(req: S.Insights.insights_get_request): Promise<S.Entries.Entry[]> {
    const {tags, startDate, endDate, search} = req
    const tids = boolMapToKeys(tags)
    if (!tids.length) {
      throw new GnothiError({key: "NO_TAGS"})
    }
    const endDate_ = (endDate === "now" || !endDate) ? dayjs().add(1, "day").toDate() : endDate
    const entries = await db.executeStatement({
      sql: `
        select e.*
        from entries e
               inner join entries_tags et on e.id = et.entry_id
        where e.user_id = :user_id
          and e.created_at > :startDate::date
          and e.created_at <= :endDate::date
          and et.tag_id in :tids
        group by e.id
        order by e.created_at asc;
      `,
      parameters: [
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"},
        {name: "startDate", value: {stringValue: startDate}},
        {name: "endDate", value: {stringValue: endDate_}},
        {name: "tids", typeHint: "UUID", value: {arrayValue: {stringValues: tids}}}
      ]
    })
    return entries
  }
}
