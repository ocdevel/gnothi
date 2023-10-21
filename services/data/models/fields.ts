import {Base} from './base'
import {DB} from '../db'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {users} from '../schemas/users'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import {influencers, Influencer} from '../schemas/influencers'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';

export class Fields extends Base {
  async list() {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.select().from(fields).where(eq(fields.user_id, uid)).orderBy(desc(fields.created_at))
    return res.map(DB.removeNull)
  }


  async post(req: S.Fields.fields_post_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.insert(fields).values({
      name: req.name,
      type: req.type,
      default_value: req.default_value,
      default_value_value: req.default_value_value,
      lane: req.lane,
      user_id: uid
    }).returning()
    return res.map(DB.removeNull)
  }

  async put(req: S.Fields.fields_put_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const {id, ...field} = req
    const res = await drizzle.update(fields)
      .set(field)
      .where(and(
        eq(fields.id, id),
        eq(fields.user_id, uid)
      ))
      .returning()
    return res.map(DB.removeNull)
  }

  async delete(req: S.Fields.fields_delete_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.delete(fields)
      .where(and(
        eq(fields.id, req.id),
        eq(fields.user_id, uid)
      ))
      .returning()
    return res.map(DB.removeNull)
  }


  async entriesList(req: S.Fields.fields_entries_list_request) {
    const {uid, db} = this.context
    const day = req.day
    return db.query<S.Fields.fields_list_response>(sql`
      ${this.with_tz()}
      select fe.* from ${fieldEntries} fe
      inner join with_tz on with_tz.id=fe.user_id 
      where fe.user_id=${uid}
      and date(${this.tz_read(day)})=
          --use created_at rather than day in case they switch timezones
          date(fe.created_at at time zone with_tz.tz)`)
  }

  async entriesPost(req: S.Fields.fields_entries_post_request) {
    const {uid, db} = this.context
    const {day, field_id, value} = req


    // Big ol' query which (1) logs the field-entry; (2) scores the field; (3) updates the global (user) score.
    // Thanks GPT!
    // TODO I had to remove all table/column interpolation. I think drizzle is creating aliases, which is
    // causing cross-CTE alias reference issues? The error is:
    // TypeError: Converting circular structure to JSON\n    --> starting at object with constructor 'PgTable'\n    |     property 'id' -> object with constructor 'PgUUID'\n    --- property 'table' closes the circle
    // NOTE: due to that, remember the table field_entries2, NOT field_entries. If I ever change the table name,
    // remember to change that here too.
    const res = await db.query(sql`
      WITH with_tz AS (
        select id, coalesce(timezone, 'America/Los_Angeles') as tz
        from users where id=${this.context.vid}
      ),
      -- Fetch the old value
      old_value AS (
        SELECT value
        FROM field_entries2
        WHERE user_id=${uid} AND field_id=${field_id}
        ORDER BY created_at DESC
        LIMIT 1
      ),
      -- Your existing upsert logic
      upsert AS (
        INSERT INTO field_entries2 (user_id, field_id, value, day, created_at)
        SELECT 
          ${uid}, 
          ${field_id}, 
          ${value}, 
          DATE(COALESCE(${day || null}::TIMESTAMP AT TIME ZONE with_tz.tz, now() AT TIME ZONE with_tz.tz)), 
          COALESCE(${day || null}::TIMESTAMP AT TIME ZONE with_tz.tz, now())
        FROM with_tz
        ON CONFLICT (field_id, day) DO UPDATE SET value=${value}
        RETURNING *
      ),
      -- Determine the score difference
      score_diff AS (
        SELECT             
          (SELECT value FROM upsert) - COALESCE((SELECT value FROM old_value), 0) AS diff
      ),
      -- Update the field's score
      field_update AS (
        UPDATE fields
        SET score_total = score_total + (SELECT diff FROM score_diff)
        WHERE id = ${field_id}
        RETURNING *
      ),
      -- Determine the direction of scoring based on score_up_good
      score_direction AS (
        SELECT
          (SELECT diff FROM score_diff) *
          CASE
            WHEN score_up_good THEN 1
            ELSE -1
          END AS final_diff
        FROM field_update
      ),
      -- Update the field's average value
      average_update AS (
        UPDATE fields SET avg=(
            SELECT AVG(value) FROM field_entries2 fe
            WHERE fe.field_id=${field_id} AND fe.value IS NOT NULL
        ) WHERE id=${field_id}
      ),
      user_update AS (
        -- Update the user's score
        UPDATE users
        SET score = score + (SELECT final_diff FROM score_direction)
        WHERE id = ${uid}
        RETURNING *
      )
      SELECT
        row_to_json(user_update.*) AS user_update,
        row_to_json(field_update.*) AS field_update,
        row_to_json(upsert.*) AS field_entry_update
      FROM
        user_update, field_update, upsert;
    `)

    const {user_update, field_update, field_entry_update} = res[0]

    // const res = await db.query(sql`
    //   ${this.with_tz()}
    //   insert into ${fieldEntries} (user_id, field_id, value, day, created_at)
    //   select ${uid}, ${field_id}, ${value}, date(${this.tz_read(day)}), ${this.tz_write(day)}
    //   from with_tz
    //   on conflict (field_id, day) do update set value=${value}
    //   returning *
    // `)

    // FIXME send user_update, field_update

    return [field_entry_update]
  }

  async historyList(req: S.Fields.fields_history_list_request) {
    const {uid, db} = this.context
    const {id} = req
    const res = await db.drizzle.execute(sql`
      select fe.value, fe.created_at from ${fieldEntries} fe
      where fe.field_id=${id} and fe.value is not null and fe.created_at is not null
      order by fe.created_at asc
    `)
    return res
  }

  async influencersList() {
    const {uid, db} = this.context
    const res = await db.drizzle.execute(sql`
      select i.* from ${influencers} i
      inner join ${fields} f on f.id=i.field_id
        and f.user_id=${uid}
    `)
    return res
  }
}
