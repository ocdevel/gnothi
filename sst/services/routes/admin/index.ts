import {Routes} from '@gnothi/schemas'
import {FnContext, Route} from '../types'
import {users, User} from '../../data/schemas/users'
import {and, eq, sql} from 'drizzle-orm'
import {DB} from '../../data/db'

const r = Routes.routes

const query = sql`
SELECT
    (SELECT gen_random_uuid()) as id,
    (SELECT COUNT(*) FROM users) AS n_users,
    (SELECT COUNT(*) FROM users WHERE created_at > '2023-05-28') AS n_users_v1,
    (SELECT COUNT(*) FROM users WHERE updated_at > '2023-05-28' AND created_at < '2023-05-28') AS n_users_v0_returning,
    (SELECT COUNT(*) FROM entries) AS n_entries,
    (SELECT COUNT(*) FROM entries WHERE created_at > '2023-05-28') AS n_entries_v1,
    (SELECT COUNT(*) FROM notes) AS n_notes,
    (SELECT COUNT(*) FROM notes WHERE created_at > '2023-05-28') AS n_notes_v1
--     (
--         SELECT jsonb_agg(jsonb_build_object('day', day, 'count', ct))
--         FROM (
--             SELECT DATE(created_at) AS day, COUNT(*) as ct
--             FROM entries
--             GROUP BY DATE(created_at)
--         ) AS entries_by_day
--     ) AS entries_by_day,
--     (
--         SELECT jsonb_agg(jsonb_build_object('day', day, 'count', ct))
--         FROM (
--             SELECT DATE(created_at) AS day, COUNT(*) as ct
--             FROM notes
--             GROUP BY DATE(created_at)
--         ) AS notes_by_day
--     ) AS notes_by_day;
`

export const admin_analytics_list_request = new Route(r.admin_analytics_list_request, async (req, context) => {
  if (!context.user.is_superuser) {return []}
  const res = await context.db.drizzle.execute(query)
  return res.rows
})
