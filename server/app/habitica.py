import requests, pdb, time, random
from dateutil.parser import parse as dparse
from common.utils import is_dev, vars
from common.database import session
import common.models as M
from sqlalchemy import text
from fastapi_sqlalchemy import db
import logging
logger = logging.getLogger(__name__)


def sync_for(user):
    if is_dev(): return
    if not (user.habitica_user_id and user.habitica_api_token):
        return
    # https://habitica.com/apidoc/#api-Task-GetUserTasks
    logger.info("Calling Habitica")
    headers = {
        "Content-Type": "application/json",
        "x-api-user": user.habitica_user_id,
        "x-api-key": user.habitica_api_token,
        "x-client": f"{vars.HABIT_USER}-{vars.HABIT_APP}"
    }
    tasks = requests.get(
        'https://habitica.com/api/v3/tasks/user',
        headers=headers
    ).json()['data']
    huser = requests.get(
        'https://habitica.com/api/v3/user?userFields=lastCron,needsCron,preferences',
        headers=headers
    ).json()['data']

    # don't pull field if they're in the inn
    if huser['preferences']['sleep']: return

    # Use SQL to determine day, so not managing timezones in python + sql
    tz = M.User.tz(db.session, user.id)
    last_cron = db.session.execute(text("""
    select date(:lastCron ::timestamptz at time zone :tz)::text last_cron
    """), dict(lastCron=huser['lastCron'], tz=tz)).fetchone().last_cron

    f_map = {f.service_id: f for f in user.fields}
    t_map = {task['id']: task for task in tasks}

    # Remove Habitica-deleted tasks
    for f in user.fields:
        if f.service != 'habitica': continue
        if f.service_id not in t_map:
            db.session.delete(f)
    db.session.commit()

    # Add/update tasks from Habitica
    for task in tasks:
        # {id, text, type, value}
        # habit: {counterUp, counterDown}
        # daily:{checklist: [{completed}], completed, isDue}

        # only care about habits/dailies
        if task['type'] not in ['habit', 'daily']: continue

        f = f_map.get(task['id'], None)
        if not f:
            # Field doesn't exist here yet, add it.
            # TODO delete things here if deleted in habitica
            f = M.Field(
                service='habitica',
                service_id=task['id'],
                name=task['text'],
                type='number'
            )
            user.fields.append(f)
        # Text has changed on Habitica, update here
        if f.name != task['text']:
            f.name = task['text']

        db.session.commit()  # for f to have f.id

        value = 0.
        # Habit
        if task['type'] == 'habit':
            value = (task['counterUp'] or 0.) - (task['counterDown'] or 0.)
        # Daily
        else:
            value = 1. if task['completed'] \
                else 0. if not task['isDue'] \
                else -1.

            # With Checklist
            cl = task['checklist']
            if (not task['completed']) and any(c['completed'] for c in cl):
                value = sum(c['completed'] for c in cl) / len(cl)

        M.FieldEntry.upsert(db.session, user_id=user.id, field_id=f.id, value=value, day=last_cron)
        M.Field.update_avg(f.id)
        logger.info(task['text'] + " done")


def cron():
    with db():
        k = 'habitica'
        logger.info(f"Running {k}")
        users = db.session.execute(f"""
        select id from users 
        where char_length(habitica_user_id) > 0 and char_length(habitica_api_token) > 0
            -- stop tracking inactive users
            and updated_at > now() - interval '3 days'
        """).fetchall()

        errs = ""
        for u in users:
            try:
                sync_for(db.session.query(M.User).get(u.id))
            except Exception as err:
                errs += "\n" + str(err)
        if errs: logger.error(errs)
        return {}
