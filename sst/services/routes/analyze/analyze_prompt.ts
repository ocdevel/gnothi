import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {completion} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {analyze_get_request, analyze_ask_response, analyze_themes_response, analyze_summarize_response} from '@gnothi/schemas/analyze'
import {summarize, summarizeAnalyze} from '../../ml/node/summarize'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {Analyze} from '../../data/models/analyze'

const r = S.Routes.routes

r.analyze_prompt_request.fn = r.analyze_prompt_request.fnDef.implement(async (req, context) => {
  const entries = await db.executeStatement<S.Entries.Entry>({
    sql: "select * from entries where user_id=:user_id and entry_id in :entry_ids order by created_at asc",
    parameters: [
      {name: "user_id", typeHint: "UUID", value: {stringValue: context.user.id}},
      {name: "entry_ids", typeHint: "UUID", value: {arrayValue: {stringValues: req.entry_ids}}}
    ]
  })
  const entry = entries.map(e => e.ai_text || e.text).join('\n')
  const prompt = req.prompt.replace("<entry>", entry)
  const response = await completion(prompt)
  return [{response}]
})
