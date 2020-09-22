import json, os, pytz, datetime
from box import Box

DROP_SQL = 'DROP SCHEMA public CASCADE;CREATE SCHEMA public;'

# 82fa7285: join paths (in case file in different location)
def load_json(fname):
    path_ = os.path.join(os.path.dirname(__file__), fname)
    json_ = {}
    if not os.path.exists(path_):
        path_ = '/storage/' + fname
    if os.path.exists(path_):
        with open(path_, 'r') as f:
            json_ = json.load(f)
    return Box(json_, box_dots=True, default_box=True)

config_example_json = load_json('config.example.json')
config_json = load_json('config.json')

# Recursively add env vars from config.example.json as template, and (1) os.environ,
# (2) config.json as values. Nested json vars are squashed as parent_child_child2 etc
vars = Box()
def add_var(k, v):
    if type(v) in [dict, Box]:
        for k2, v2 in v.items():
            add_var(f"{k}.{k2}", v2)
        return
    config_val = config_json[k] or None # using dots
    k = k.replace('.', '_')
    val = os.environ.get(k, config_val)
    vars[k] = val

    # Boto3 wants env vars, can't find way to set via sdk
    if k and val and k.startswith("AWS_") and not os.environ.get(k, False):
        os.environ[k] = val

for k, v in config_example_json.items():
    add_var(k, v)

vars['DB_NAME'] = dict(
    development='gnothi_dev',
    production='gnothi_prod',
    testing='gnothi_test'
)[vars.ENVIRONMENT] or 'gnothi_dev'

def is_prod(): return vars.ENVIRONMENT == 'production'
def is_test(): return vars.ENVIRONMENT == 'testing'
def is_dev():
    return vars.ENVIRONMENT in ('development', 'testing')


if vars.ENVIRONMENT == 'production':
    vars['DB_URL'] = vars.DB_PROD_URL
    vars['DB_NAME'] = vars.DB_PROD_NAME

vars['DB_FULL'] = f"{vars.DB_URL}/{vars.DB_NAME}"
vars['DB_PROD_FULL'] = f"{vars.DB_PROD_URL}/{vars.DB_PROD_NAME}"

SECRET = vars.FLASK_KEY

from multiprocessing import cpu_count
THREADS = cpu_count()

# use this in explicit sql queries instead of "now()". SQLAlchemy models will handle
# it automatically via datetime.utcnow, but engine.execute("now()") will not be utc
utcnow = "TIMEZONE('utc', CURRENT_TIMESTAMP)"

def nowtz(tz='America/Los_Angeles'):
    return datetime.datetime.now(pytz.timezone(tz))
