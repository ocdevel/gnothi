import {Base} from './base'
import {DB} from '../db'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {users} from '../schemas/users'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import {influencers, Influencer} from '../schemas/influencers'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import {Routes} from '@gnothi/schemas'

const r = Routes.routes

export class Fields extends Base {
  async list() {
    const {uid, db} = this.context
    const {drizzle} = db
    const res = await drizzle.select()
      .from(fields)
      .where(eq(fields.user_id, uid))
      .orderBy(asc(fields.sort), desc(fields.created_at))
    return res.map(DB.removeNull)
  }


  async post(req: S.Fields.fields_post_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    // git-blame removed scrubbing, since that's handled via zod fields_post_request
    const res = await drizzle.insert(fields).values({
      ...req,
      user_id: uid
    }).returning()
    return res.map(DB.removeNull)
  }

  async put(req: S.Fields.fields_put_request) {
    const {uid, db} = this.context
    const {drizzle} = db
    const {id, ...field} = req

    const res = await drizzle.update(fields)
      .set({
        ...field,
        // detach the habitica service when they submit, so they have time to acknowledge it on the client
        service: sql`CASE WHEN service='habitica' THEN NULL ELSE service END`
      })
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

  async sort(req: S.Fields.fields_sort_request): Promise<void> {
    const {uid, db: {drizzle}} = this.context
    const q = sql.empty()

    req.forEach((f: S.Fields.fields_sort_request[0], i: number) => {
      q.append(i === 0 ? sql`WITH` : sql`,`)
      q.append(sql` update_${sql.raw(i)} AS (
        UPDATE fields SET sort=${f.sort} 
        WHERE id=${f.id} AND user_id=${uid} 
      )`)
    })
    // q.append(sql` SELECT * FROM fields WHERE user_id=${uid} ORDER BY sort ASC, created_at DESC;`)
    // return drizzle.execute(q)

    // FIXME the final select isn't the updated values for some reason. Investigate, or try to get batch API working
    q.append(sql` SELECT 1`)
    await drizzle.execute(q)
    return this.list()

    // Can't get the batch API working, which is a huge bummer! Says it requires LibSQL, look into
    // https://orm.drizzle.team/docs/batch-api
    // return drizzle.batch(req.map((field: S.Fields.fields_sorts_request[0]) => {
    //   return drizzle.update(fields)
    //     .set({sort: field.sort})
    //     .where(eq(fields.id, field.id))
    // }))
  }

  async entriesList(req: S.Fields.fields_entries_list_request) {
    const {uid, db} = this.context
    const day = req.day
    return db.query<S.Fields.fields_list_response>(sql`
      ${this.with_tz()}
      SELECT fe.* FROM ${fieldEntries} fe
      INNER JOIN with_tz ON with_tz.id=fe.user_id 
      WHERE fe.user_id=${uid}
      AND DATE(${this.tz_read(day)})=
          --use created_at rather than day in case they switch timezones
          DATE(fe.created_at AT TIME ZONE with_tz.tz)`)
  }

  async entriesPost(req: S.Fields.fields_entries_post_request) {
    const {uid, db} = this.context
    const {field_id, value, day} = req

    // Big ol' query which (1) logs the field-entry; (2) scores the field; (3) updates the global (user) score.
    // Thanks GPT!
    // TODO I had to remove all table/column interpolation. I think drizzle is creating aliases, which is
    // causing cross-CTE alias reference issues? The error is:
    // TypeError: Converting circular structure to JSON\n    --> starting at object with constructor 'PgTable'\n    |     property 'id' -> object with constructor 'PgUUID'\n    --- property 'table' closes the circle
    // NOTE: due to that, remember the table field_entries2, NOT field_entries. If I ever change the table name,
    // remember to change that here too.
    const res = await db.query(sql`
${this.with_tz()},
-- convert day requested to compatible with the user's timezone
day_requested AS (
  SELECT DATE(${this.tz_read(day)}) AS "day"
  FROM with_tz
),
field AS (SELECT * FROM fields WHERE id = ${field_id} AND user_id = ${uid}),
-- if there's an existing entry for today, pull that up for diffing against. We don't diff if they haven't logged
-- today, or if it's a reward, so we return null from this CTE which gets COALESCE'd later
existing_entry AS (
  SELECT field_id, 
    field_entries2."value"
  FROM field_entries2
  JOIN field 
    ON field.id = field_entries2.field_id
  WHERE field_id = ${field_id} 
    AND lane != 'reward'
    AND "day"=(SELECT "day" FROM day_requested)
  -- LIMIT 1 -- there should only ever be one, so I'm commenting out to detect errors
),
-- Your existing upsert logic
upsert AS (
  INSERT INTO field_entries2 (user_id, field_id, "value", "day", created_at)
  SELECT
    ${uid}, 
    ${field_id}, 
    ${value}, 
    (SELECT "day" FROM day_requested), 
    ${this.tz_write(day)}
  FROM field
  JOIN with_tz ON field.user_id = with_tz.id
  WHERE 
    field.id = ${field_id}
    AND (
      lane != 'reward' 
      OR (lane = 'reward' AND ${value} <= (SELECT points FROM users WHERE users.id = ${uid}))
    )
  ON CONFLICT (field_id, "day") DO UPDATE SET "value" = ${value}
  RETURNING *
),
-- If they have an entry already for today, the points we'll apply elsewhere are the diff form its last value, 
-- and what they just submitted. If they don't have an entry, the "diff" is just the score whole-sale
score_diff AS (
  SELECT 
    score_enabled, 
    CASE WHEN score_up_good THEN 1 ELSE -1 END AS direction,
    (
      -- will be 0 if it was a reward they couldn't afford,  since upsert skipped
      COALESCE((SELECT "value" FROM upsert), 0) 
      -- will be 0 if it's the first entry of the day
      - COALESCE((SELECT "value" FROM existing_entry), 0)
    ) AS diff
  -- don't FROM upsert, since that may be null if "reward you can't afford"
  FROM field WHERE field.id = ${field_id}
),
-- Update the field's score and score_period
field_update AS (
  UPDATE fields
  SET 
    score_total = score_total + (CASE WHEN score_enabled THEN (SELECT diff FROM score_diff) ELSE 0 END),
    score_period = score_period + (CASE WHEN score_enabled THEN (SELECT diff FROM score_diff) ELSE 0 END)
  WHERE id = ${field_id}
  RETURNING *
),
-- Update the field's average value
average_update AS (
  UPDATE fields SET "avg" = (
    SELECT AVG("value") FROM field_entries2 fe
    WHERE fe.field_id=${field_id} AND fe.value IS NOT NULL
  ) WHERE id=${field_id}
),
user_update AS (
  -- Update the user's score
  UPDATE users
  SET points = points + (
    SELECT (CASE WHEN score_enabled THEN diff * direction ELSE 0 END)
    FROM score_diff
  )
  WHERE 
    users.id = ${uid}
  RETURNING users.*
)
SELECT
  row_to_json(user_update.*) AS user_update,
  row_to_json(field_update.*) AS field_update,
  row_to_json(upsert.*) AS field_entry_update
FROM
  user_update, field_update, upsert;
`)
    return res
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

  /**
   * Once every hour, this function is called via sst.Cron. Grab all users whose timezone dictates that now is midnight their time. For each of their fields
   * check if that field is incomplete. If they completed it already (per `entriesPost()` above), they will have already gained the point(s); so this
   * function determines only how many points they lose (deducted from `user.points`) for today. Determining whether a field is incomplete is based on 
   * a the attributes of this field found in services/data/schemas/fields.ts.
   * Note that fields don't need to be "unchecked" - a field shows an empty checkbox in the UI if there's no existing fieldEntry for today,
   * and shows a filled checkbox otherwise.
   */
  async cron() {
    const {db: {drizzle}} = this.context
    console.log("calling fields cron")
    // Since there's no user.last_cron field tracking this, this function depends on being called excatly
    // once each hour without fail.
    // TODO add a user.last_cron, and use that instead of 0-1 hour checks
    const megaQuery = sql`
-- CREATE OR REPLACE FUNCTION process_fields() RETURNS void LANGUAGE plpgsql AS $$
-- BEGIN
WITH
  -- not using Base.with_tz since it selects where context.vid, we need all users
  with_tz AS (
    SELECT u.id, COALESCE(u.timezone, 'America/Los_Angeles') AS tz
    FROM users u
  ),
  midnight_users AS (
    SELECT wt.id, wt.tz
    FROM with_tz wt
    WHERE EXTRACT(HOUR FROM now() AT TIME ZONE wt.tz) = 0
  ),
  -- Identify the fields to process based on the hour of execution in their local time
  active_fields AS (
    SELECT f.*,
      GREATEST(f.reset_quota - f.score_period, 0) AS points_to_deduct
    FROM fields f
    INNER JOIN midnight_users mu ON mu.id = f.user_id
    WHERE
      -- rewards are reset-period=never, but allow for user-custom options too (instead of checking lane='reward')
      f.reset_period != 'never' AND
      f.score_enabled = true AND (
        (f.reset_period = 'daily' AND (
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 0 AND f.sunday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 1 AND f.monday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 2 AND f.tuesday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 3 AND f.wednesday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 4 AND f.thursday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 5 AND f.friday) OR
          (EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 6 AND f.saturday)
        )) OR
        (f.reset_period = 'weekly' AND EXTRACT(DOW FROM now() AT TIME ZONE mu.tz) = 0) OR
        (f.reset_period = 'monthly' AND EXTRACT(DAY FROM now() AT TIME ZONE mu.tz) = 1)
        -- ... and so on for other periods
      )
  ),
  -- Deduct from score_total for any fields which didn't meet their quota
  fields_update AS (
    UPDATE fields f
    SET 
      score_total = f.score_total - af.points_to_deduct,
      score_period = 0,
      streak = CASE WHEN af.points_to_deduct > 0 THEN 0 ELSE f.streak + 1 END
    FROM active_fields af
    WHERE f.id = af.id
  ),
  agg_deduction AS (
    SELECT af.user_id, SUM(af.points_to_deduct) AS points_to_deduct
    FROM active_fields af
    GROUP BY af.user_id
  ),
  update_users AS (
    UPDATE users u
    SET points = u.points - ad.points_to_deduct
    FROM agg_deduction ad
    WHERE u.id = ad.user_id
  )
  SELECT 1;
`
    await db.query(megaQuery)
    console.log("called fields cron")
  }
}