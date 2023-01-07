import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {completion} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {ulid} from 'ulid'

const r = S.Routes.routes

r.insights_prompt_request.fn = r.insights_prompt_request.fnDef.implement(async (req, context) => {
  const entries = await db.executeStatement<S.Entries.Entry>({
    sql: "select text_clean, ai_text from entries where user_id=:user_id and id in :entry_ids order by created_at asc",
    parameters: [
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}},
      {name: "entry_ids", typeHint: "UUID", value: {arrayValue: {stringValues: req.entry_ids}}}
    ]
  })
  const entry = entries.map(e => e.text_clean || e.ai_text || e.text).join('\n')
  const prompt = req.prompt.replace("<entry>", entry)
    .replace("<summary>", entry) // FIXME
    .replace("<paragraphs>", entry) // FIXME
  const response = await completion(prompt)
  return [{view: req.view, response}]
})
