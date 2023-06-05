import {Base} from './base'
import {DB} from '../db'
import * as S from '@gnothi/schemas'
import {users, User} from '../schemas/users'
import {fields, Field} from '../schemas/fields'
import {fieldEntries, FieldEntry} from '../schemas/fieldEntries'
import {and, asc, desc, eq, inArray, or, sql} from 'drizzle-orm';
import {Config} from 'sst/node/config'
import axios from 'axios';
import _ from 'lodash'
import {FnContext} from "../../routes/types";
import {Logger} from '../../aws/logs'


interface Task {
  id: string;
  text: string;
  type: string;
  counterUp: number | null;
  counterDown: number | null;
  completed: boolean;
  isDue: boolean;
  checklist: { completed: boolean }[];
}

export class Habitica extends Base {
  async syncFor(user: User) {
    if (!(user.habitica_user_id && user.habitica_api_token)) {
      return;
    }
    const context = this.context
    const driz = context.db.drizzle

    // https://habitica.com/apidoc/#api-Task-GetUserTasks
    console.log("Calling Habitica")
    const headers = {
      "Content-Type": "application/json",
      "x-api-user": user.habitica_user_id,
      "x-api-key": user.habitica_api_token,
      "x-client": `${Config.HABITICA_USER}-${Config.HABITICA_APP}`
    }

    const tasks_ = await axios.get('https://habitica.com/api/v3/tasks/user', {headers})
    const tasks = tasks_.data.data as Task[]
    const huser_ = await axios.get('https://habitica.com/api/v3/user?userFields=lastCron,needsCron,preferences', {headers})
    const huser = huser_.data.data as any

    // don't pull field if they're in the inn
    if (huser.preferences.sleep) {
      return
    }

    // Use SQL to determine day, so not managing timezones in python + sql
    const lastCron = (await driz.execute(sql`
      with tz as (
        select coalesce(${users.timezone}, 'America/Los_Angeles') as tz
        from users
        where id=${user.id}
      )
      select date(${huser.lastCron}::timestamptz at time zone tz.tz)::text last_cron
      from tz;
    `)).rows[0].last_cron

    const userFields = (await driz.select().from(fields).where(and(
      eq(fields.user_id, user.id),
      eq(fields.service, 'habitica')
    )))

    const f_map = _.keyBy(userFields, 'service_id')
    const t_map = _.keyBy(tasks, 'id')


    // Remove Habitica-deleted tasks
    let deleteIds = userFields.filter(f => !t_map[f.service_id]).map(f => f.id)
    if (deleteIds.length) {
      await driz.delete(fields).where(inArray(fields.id, deleteIds))
    }

    // Add/update tasks from Habitica
    // iterate over tasks

    for (const task of tasks) {
      // {id, text, type, value}
      // habit: {counterUp, counterDown}
      // daily:{checklist: [{completed}], completed, isDue}

      // only care about habits/dailies
      if (!['habit', 'daily'].includes(task.type)) {
        continue
      }

      let f: Field | undefined = f_map[task.id]
      if (!f) {
        // Field doesn't exist here yet, add it.
        // TODO delete things here if deleted in habitica
        const f_ = await driz.insert(fields).values({
          service: 'habitica',
          service_id: task.id,
          name: task.text,
          type: 'number',
          user_id: user.id
        }).returning()
        f = f_[0]
      }
      // Text has changed on Habitica, update here
      if (f.name !== task.text) {
        const f_ = await driz.update(fields)
          .set({name: task.text})
          .where(eq(fields.id, f.id))
          .returning()
        f = f_[0]
      }

      // db.commit()  # for f to have f.id

      let value = 0.0
      // Habit
      if (task.type === 'habit') {
        value = (task.counterUp || 0.0) - (task.counterDown || 0.0)
        // Daily
      } else {
        value = (task.completed ? 1.0
          : task.isDue ? 0.0
            : -1.0)

        // With Checklist
        const cl = task.checklist
        if (!task.completed && cl.some(c => c.completed)) {
          value = cl.reduce((sum, c) => sum + c['completed'], 0) / cl.length;

        }

        await context.m.fields.entriesPost({
          user_id: user.id,
          field_id: f.id,
          value: value,
          day: lastCron
        })
        // FIXME
        // M.Field.update_avg(db, f.id)
        console.log(task.text, value, lastCron)
      }
    }
  }

  async cron() {
    const {db} = this.context
    const driz = db.drizzle
    const k = 'habitica'
    console.log(`Running ${k}`)
    const users = await driz.execute<User>(sql`
      select id, habitica_user_id, habitica_api_token
      from users
      where char_length(habitica_user_id) > 0
        and char_length(habitica_api_token) > 0
        -- stop tracking inactive users
        and updated_at > now() - interval '4 days'
      order by updated_at desc
    `)

    let errs = []
    for (const u of users.rows) {
      try {
        await this.syncFor(u)
      } catch (err) {
        errs.push(err)
      }
    }
    if (errs.length) {
      Logger.error({data: errs, event: "data/models/habitica#cron"})
    }
    return {}
  }
}
