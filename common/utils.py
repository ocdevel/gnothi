import json, os, pytz, datetime
from box import Box

DROP_SQL = 'DROP SCHEMA public CASCADE;CREATE SCHEMA public;'

def is_dev():
    return os.environ['ENVIRONMENT'] == 'development'

def join_(paths):
    return os.path.join(os.path.dirname(__file__), *paths)

config_json = json.load(open(join_(['config.json'])))
vars = {}
keys = """
DB_PROD_URL
DB_PROD_NAME
DB_URL
DB_NAME
DB_BOOKS
HABIT
FLASK_KEY
GPU_INSTANCE
EMAIL
"""
for k in keys.split():
    vars[k] = os.environ.get(k, config_json.get(k, None))
vars = Box(vars)

if os.environ['ENVIRONMENT'] == 'production':
    vars['DB_URL'] = vars.DB_PROD_URL
    vars['DB_NAME'] = vars.DB_PROD_NAME

vars['DB_URL'] = f"{vars.DB_URL}/{vars.DB_NAME}"
vars['DB_PROD_URL'] = f"{vars.DB_PROD_URL}/{vars.DB_PROD_NAME}"
#print(vars.DB_URL)

SECRET = vars.FLASK_KEY

from multiprocessing import cpu_count
THREADS = cpu_count()

# use this in explicit sql queries instead of "now()". SQLAlchemy models will handle
# it automatically via datetime.utcnow, but engine.execute("now()") will not be utc
utcnow = "now() at time zone 'utc'"

def nowtz(tz='America/Los_Angeles'):
    return datetime.datetime.now(pytz.timezone(tz))
