import * as S from '@gnothi/schemas'
import {db} from '../../data/db'

const r = S.Routes.routes

function tagsToBoolMap(tags: string): Record<string, boolean> {
  // comes in from json_agg, field returned as JSON string
  const tags_ = JSON.parse(tags)
  return Object.fromEntries(tags_.map(({tag_id}) => [tag_id, true]))
}

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {
  const rows = await db.exec({
    sql: `
      select e.*,
             json_agg(et.*) as tags
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
      group by e.id
      order by e.created_at desc;
    `,
    values: {user_id: context.user.id},
    zIn: S.Tags.EntryTag.merge(S.Entries.Entry)
  })
  // TODO update SQL to do this conversion, we'll use it elsewhere
  return rows.map(({tags, ...entry}) => ({
    entry,
    tags: tagsToBoolMap(tags)
  }))
})
