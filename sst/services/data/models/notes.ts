import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {entries_list_response} from '@gnothi/schemas/entries'
import {eq, and, or, not, inArray, lt, asc, desc} from 'drizzle-orm/pg-core/expressions'
import {sql, SQL} from "drizzle-orm/sql"
import {entries, Entry} from '../schemas/entries'
import {entriesTags} from '../schemas/entriesTags'
import {FnContext} from "../../routes/types";
import {notes, Note} from '../schemas/notes'
import _ from 'lodash'

export class Notes extends Base {
  async post(req: S.Notes.entries_notes_post_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const eid = req.entry_id
    const note = await drizzle
      .insert(notes)
      .values({...req, user_id: uid})
      .returning()
    await drizzle.execute(sql`
      update entries e set n_notes=(select count(*) from notes where entry_id=${eid})
      where e.id=${eid}
    `)
    return [note]
  }

  async list(req: S.Notes.entries_notes_list_request) {
    // TODO allow snooping (see python model), and private/public viewing even besides snooping
    const {uid, db} = this.context
    const {drizzle} = db
    const {entry_id} = req
    return drizzle.select().from(notes)
      .where(and(eq(notes.user_id, uid), eq(notes.entry_id, entry_id)))
      .orderBy(asc(notes.created_at))
  }

}
