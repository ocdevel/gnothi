import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"

const r = S.Routes.routes




r.insights_get_request.fn = r.insights_get_request.fnDef.implement(async (req, context) => {
  const {tags, startDate, endDate, search} = req
  const tids = _reduce(tags, (m,v,k) => {
    if (!v) {return m}
    return [...m, k]
  }, [])
  if (!tids.length) {
    throw new GnothiError({key: "NO_TAGS"})
  }
  const [tids_placeholder, tids_params] = db.arrayValueFix(tids)
  const endDate_ = (endDate === "now" || !endDate) ? dayjs().add(1, "day").toDate() : endDate
  const entries = await db.executeStatement({
    sql: `
      select e.*
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
        and e.created_at > :startDate::date
        and e.created_at <= :endDate::date
        and et.tag_id in (${tids_placeholder})
      group by e.id
      order by e.created_at asc;
    `,
    parameters: [
      {name: "user_id", value: {stringValue: context.user.id}, typeHint: "UUID"},
      {name: "startDate", value: {stringValue: startDate}},
      {name: "endDate", value: {stringValue: endDate_}},
      ...tids_params
    ]
  })
  console.log(entries)
  return [{ok: true}]
})
