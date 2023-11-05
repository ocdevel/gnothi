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
    const {day, field_id, value} = req


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

  async cron() {
    const {db: {drizzle}} = this.context
    console.log("calling fields cron")
    // Since there's no user.last_cron field tracking this, this function depends on being called excatly
    // once each hour without fail.
    // TODO add a user.last_cron, and use that instead of 0-1 hour checks
    const megaQuery = sql`
-- CREATE OR REPLACE FUNCTION process_fields() RETURNS void LANGUAGE plpgsql AS $$
-- BEGIN
  -- not using Base.with_tz since it selects where context.vid, we need all users
  WITH with_tz as (
    SELECT id, COALESCE(timezone, 'America/Los_Angeles') AS tz
    FROM users
  ),
  -- Identify the fields and associated users to process based on the hour of execution in their local time
  active_fields AS (
    SELECT f.*
    FROM fields f
    JOIN with_tz ON with_tz.id = f.user_id
    WHERE
      -- rewards are reset-period=never, but allow for user-custom options too (instead of checking lane='reward')
      f.reset_period != 'never'
      AND f.score_enabled = true
      AND (
        (
          f.reset_period = 'daily'
          AND (
            (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 0 AND f.sunday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 1 AND f.monday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 2 AND f.tuesday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 3 AND f.wednesday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 4 AND f.thursday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 5 AND f.friday)
            OR (EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 6 AND f.saturday)
          )
          AND EXTRACT(HOUR FROM now() AT TIME ZONE with_tz.tz) = 0
        )
        OR (f.reset_period = 'weekly' AND EXTRACT(DOW FROM now() AT TIME ZONE with_tz.tz) = 0 AND EXTRACT(HOUR FROM now() AT TIME ZONE with_tz.tz) = 0)
        OR (f.reset_period = 'monthly' AND EXTRACT(DAY FROM now() AT TIME ZONE with_tz.tz) = 1 AND EXTRACT(HOUR FROM now() AT TIME ZONE with_tz.tz) = 0)
        -- ... and so on for other periods
      )
  ),
  quota_check AS (
    SELECT
      af.id,
      af.user_id,
      af.reset_quota - af.score_period AS points_to_deduct
    FROM
      active_fields af
    WHERE
      -- Only include fields where the quota hasn't been met. If they go above quota, that's given points on + button
      af.reset_quota > af.score_period  
  ),
  agg_quota_check AS (
    SELECT
      user_id,
      SUM(points_to_deduct) AS points_to_deduct
    FROM quota_check
    GROUP BY user_id
  ),
  reset_score_period AS (
    UPDATE 
      fields
    SET 
      streak = CASE WHEN score_period >= reset_quota THEN streak + 1 ELSE 0 END,
      score_period = 0
    WHERE
      id IN (SELECT id FROM active_fields)
    RETURNING id as field_id, user_id
  )
  UPDATE users u
  SET points = points - qc.points_to_deduct
  FROM agg_quota_check qc
  WHERE u.id = qc.user_id
-- END;
-- $$;
`
    await db.query(megaQuery)
    console.log("called fields cron")
  }
}
