import {Base} from './base'
import * as S from '@gnothi/schemas'
import {GnothiError} from "../../routes/errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {entries, Entry} from '../schemas/entries'
import {sql} from "drizzle-orm/sql"

export class Insights extends Base {
  async entriesByIds(entry_ids: string[]) {
    const {uid, db} = this.context
    const {drizzle} = db
    return drizzle.execute<Entry>(
      sql`select text_clean, ai_text, text_paras, text from ${entries} 
        where user_id=${uid} and id in ${entry_ids} order by created_at asc`
    )
  }
}
