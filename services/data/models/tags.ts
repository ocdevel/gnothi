import {Base} from './base'
import {DB} from '../db'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {users} from '../schemas/users'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import {Routes} from '@gnothi/schemas'
import {Tag, tags} from "../schemas/tags.js";
import {
  tags_delete_request,
  tags_post_request,
  tags_put_request,
  tags_sort_request,
  tags_toggle_request
} from "../../../schemas/tags.js";
import {entriesTags} from "../schemas/entriesTags.js";
import {GnothiError} from "../../routes/errors.js";

const r = Routes.routes

export class Tags extends Base {
  async list() {
    const {vid, db} = this.context
    const {drizzle} = db
    return db.drizzle.select().from(tags).where(eq(tags.user_id, vid)).orderBy(asc(tags.sort))
  }


  async post(req: tags_post_request) {
    const {uid, db} = this.context
    return db.query<Tag>(sql`
      insert into ${tags} (name, user_id, sort) 
      values (
        ${req.name}, 
        ${uid},
        (select max(sort) + 1 as sort 
          from ${tags} where user_id=${uid})
      )
      returning *;
      `
    )
  }

  async put(req: tags_put_request) {
    const {uid, db} = this.context
    return db.drizzle.update(tags).set({
      name: req.name,
      ai_index: req.ai_index,
      ai_summarize: req.ai_summarize,
      sort: req.sort
    })
      .where(and(eq(tags.user_id, uid), eq(tags.id, req.id)))
      .returning()
  }

  async destroy(req: tags_delete_request) {
    const {uid, db} = this.context
    const res = await db.query(sql`
      WITH entries_ AS (
        SELECT tag_id, array_agg(entry_id) as ids
        FROM entries_tags
        WHERE tag_id=${req.id}
        GROUP BY tag_id
      )
      SELECT tags.id, tags.main, entries_.ids AS entry_ids
      FROM tags
      LEFT JOIN entries_ ON entries_.tag_id=tags.id
      WHERE id=${req.id}
    `)
    const tag = res[0]
    if (!tag) {return []}
    if (tag.main) {
      throw new GnothiError({message: "Can't delete your main tag"})
    }
    if (tag.entry_ids?.length) {
      // TODO
      throw new GnothiError({message: "Can't delete tags which are applied to entries. Un-tag your entries first. I'll fix this eventually (by moving these entries to Main)."})
    }
    await db.query(sql`delete from ${tags} where id=${req.id}`)
    return this.list()
  }

  async toggle(req: tags_toggle_request) {
    // update returning: https://stackoverflow.com/questions/7923237/return-pre-update-column-values-using-sql-only
    return this.context.db.query<Tag>(
      sql`update ${tags} x set selected=(not y.selected)
        from ${tags} y 
        where x.id=${req.id} and x.id=y.id
        returning x.*`
    )
  }

  async reorder(req: tags_sort_request): Promise<void> {
    const {uid, db: {drizzle}} = this.context
    const q = sql.empty()

    req.forEach((f: S.Fields.fields_sort_request[0], i: number) => {
      q.append(i === 0 ? sql`WITH` : sql`,`)
      q.append(sql` update_${sql.raw(i)} AS (
        UPDATE tags SET sort=${f.sort} 
        WHERE id=${f.id} AND user_id=${uid} 
      )`)
    })
    // FIXME the final select isn't the updated values for some reason. Investigate, or try to get batch API working
    q.append(sql` SELECT 1`)
    await drizzle.execute(q)
    return this.list()
  }

}
