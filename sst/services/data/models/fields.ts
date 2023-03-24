import {Base} from './base'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm/sql"
import {users} from '../schemas/users'
import {fields} from '../schemas/fields'
import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';

export class Fields extends Base {
  table = fields

  async list() {
    const res = await db.drizzle.select().from(fields).where(eq(fields.user_id, this.uid))
    return res.map(db.removeNull)
  }

  async post(req: S.Fields.fields_post_request) {
    const res = await db.drizzle.insert(fields).values({
      name: req.name,
      type: req.type,
      default_value: req.default_value,
      default_value_value: req.default_value_value,
      user_id: this.uid
    }).returning()
    return res.map(db.removeNull)
  }
}
