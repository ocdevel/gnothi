import requests, pdb, time, random
from dateutil.parser import parse as dparse
from common.utils import is_dev, vars, utcnow
from common.database import session
import common.models as M
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
        'https://habitica.com/api/v3/user?userFields=lastCron,needsCron',
        headers=headers
    ).json()['data']

    lastCron = dparse(huser['lastCron'])
    logger.info("Habitica finished")

    fes = M.FieldEntry.get_day_entries(user.id, day=lastCron).all()

    f_map = {f.service_id: f for f in user.fields}
    fe_map = {fe.field_id: fe for fe in fes}
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

        fe = fe_map.get(f.id, None)
        if fe:
            fe.value = value
        else:
            fe = M.FieldEntry(field_id=f.id, created_at=lastCron, value=value)
            user.field_entries.append(fe)
        db.session.commit()
        logger.info(task['text'] + " done")


def cron():
    with db():
        k = 'habitica'
        logger.info(f"Running {k}")
        users = db.session.execute(f"""
        select id from users 
        where char_length(habitica_user_id) > 0 and char_length(habitica_api_token) > 0
            -- stop tracking inactive users
            and updated_at > {utcnow} - interval '3 days'
        """).fetchall()

        errs = ""
        for u in users:
            try:
                sync_for(db.session.query(M.User).get(u.id))
            except Exception as err:
                errs += "\n" + str(err)
        if errs: logger.error(errs)
        return {}
