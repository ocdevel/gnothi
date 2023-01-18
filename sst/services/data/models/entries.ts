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

function tagsToBoolMap(tags: string): Record<string, boolean> {
  // comes in from json_agg, field returned as JSON string
  const tags_ = JSON.parse(tags)
  return Object.fromEntries(tags_.map(({tag_id}) => [tag_id, true]))
}

export class Entries extends Base {
  async getByIds(ids: string[]) {
    return db.executeStatement<entries_list_response[]>({
      sql: `select * from entries where id in :ids and user_id = :user_id`,
      parameters: [
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"},
        {name: "ids", typeHint: "UUID", value: {arrayValue: {stringValues: ids}}, arrayFix: "IN"}
      ]
    })
  }

  async filter(req: S.Entries.entries_list_request): Promise<entries_list_response[]> {
    const {tags, startDate, endDate} = req
    const tids = boolMapToKeys(tags)

    // TODO how to handle this with good UX?
    if (!tids.length) {
      // throw new GnothiError({key: "NO_TAGS"})
      return []
    }

    const endDate_ = (endDate === "now" || !endDate) ? dayjs().add(1, "day").toDate() : endDate
    const rows = await db.executeStatement<EntriesListSQL>({
      sql: `
        select e.*,
            json_agg(et.*) as tags
        from entries e
               inner join entries_tags et on e.id = et.entry_id
        where e.user_id = :user_id
          and e.created_at > :startDate::date
          and e.created_at <= :endDate::date
          and et.tag_id in :tids
        group by e.id
        order by e.created_at desc;
      `,
      parameters: [
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"},
        {name: "startDate", value: {stringValue: startDate}},
        {name: "endDate", value: {stringValue: endDate_}},
        {name: "tids", typeHint: "UUID", value: {arrayValue: {stringValues: tids}}}
      ]
    })
    // TODO update SQL to do this conversion, we'll use it elsewhere
    return rows.map(row => ({...row, tags: tagsToBoolMap(row.tags)}))
  }

  async destroy(id: string) {
    return (await db.executeStatement<entries_list_response[]>({
      sql: `delete from entries where id=:id and user_id=:user_id returning *`,
      parameters: [
        {name: "user_id", value: {stringValue: this.uid}, typeHint: "UUID"},
        {name: "id", typeHint: "UUID", value: {stringValue: id}}
      ]
    }))[0]
  }
}
