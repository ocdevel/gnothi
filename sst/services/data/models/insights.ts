import {Base} from './base'
import {db} from '../db'
import * as S from '@gnothi/schemas'
import {GnothiError} from "../../routes/errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";

export class Insights extends Base {
  async entriesByIds(entry_ids: string[]) {
    return db.executeStatement<S.Entries.Entry>({
      sql: `select text_clean, ai_text, text_paras, text from entries 
        where user_id=:user_id and id in :entry_ids order by created_at asc`,
      parameters: [
        {name: "user_id", typeHint: "UUID", value: {stringValue: this.uid}},
        {name: "entry_ids", typeHint: "UUID", value: {arrayValue: {stringValues: entry_ids}}}
      ]
    })
  }
}
