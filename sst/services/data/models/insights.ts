import {Base} from './base'
import * as S from '@gnothi/schemas'
import {GnothiError} from "../../routes/errors";
import {boolMapToKeys} from '@gnothi/schemas/utils'
import * as dayjs from "dayjs";
import {entries, Entry} from '../schemas/entries'
import {and, asc, eq, inArray} from "drizzle-orm";

export class Insights extends Base {
  async entriesByIds(entry_ids: string[]) {
    // FIXME this is copy/pasted from models/entries#getByIds, just returning fewer columns. Refactor
    const {db, vid} = this.context
    if (!entry_ids.length) return []
    return db.drizzle.select({
      text_clean: entries.text_clean,
      ai_text: entries.ai_text,
      text_paras: entries.text_paras,
      text: entries.text
    }).from(entries)
      .where(and(inArray(entries.id, entry_ids), eq(entries.user_id, vid)))
      .orderBy(asc(entries.created_at))
  }
}
