import {Base} from './base'
import * as S from '@gnothi/schemas'
import {GnothiError} from "../../routes/errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {entries, Entry} from '../schemas/entries'
import {sql} from "drizzle-orm/sql"

// prioritize clean-text, worst-case markdown
export function getText (e: Entry): string {
  return e.text_clean || e.text
}
// prioritize summary, worst-case full-text
export function getSummary(e: Entry): string {
  return e.ai_text || getText(e)
}
export function getParas(e: Entry): string[] {
  if (e.text_paras?.length) {
    return e.text_paras
  }
  // TODO text_clean won't have paras, it's clean-join()'d, no paras preserved. This line
  // should be rare though, since text_paras is likely available by now.
  return getText(e).split(/\n+/)
}

export class Insights extends Base {
  async entriesByIds(entry_ids: string[]) {
    const {uid} = this.context
    const {drizzle} = this.context.db
    return drizzle.execute<Entry>(
      sql`select text_clean, ai_text, text_paras, text from ${entries} 
        where user_id=${uid} and id in ${entry_ids} order by created_at asc`
    )
  }
}
