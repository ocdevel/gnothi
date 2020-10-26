import json, os, pytz, datetime, socket
from box import Box
from dynaconf import Dynaconf

DROP_SQL = 'DROP SCHEMA public CASCADE;CREATE SCHEMA public;'

config_paths = []
# check if the respective paths exist to load
for fname in ['config.example.json', 'config.json']:
    path_ = os.path.join(os.path.dirname(__file__), fname)
    storage_path_ = '/storage/' + fname
    if os.path.exists(path_):
        config_paths.append(path_)
    if os.path.exists(storage_path_):
        config_paths.append(storage_path_)

#load configs - overwrites as (config.example < config < /storage/config)
configs = Dynaconf(settings_files=config_paths)

# Recursively add env vars from config.json files as template, and (1) os.environ,
# (2) config.json as values. Nested json vars are squashed as parent_child_child2 etc
vars = Box()
def add_var(k, v):
    if type(v) in [dict, Box]:
        for k2, v2 in v.items():
            add_var(f"{k}.{k2}", v2)
        return
    config_val = configs[k] or None # using dots
    k = k.replace('.', '_')
    val = os.environ.get(k, config_val)
    vars[k] = val

    # Boto3 wants env vars, can't find way to set via sdk
    if k and val and k.startswith("AWS_") and not os.environ.get(k, False):
        os.environ[k] = val

for k, v in configs.as_dict().items():
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

vars['MACHINE'] = vars.MACHINE or socket.gethostname()
vars['AE_PATH'] = f"/storage/libgen/{vars.ENVIRONMENT}_all.tf"

SECRET = vars.FLASK_KEY

from multiprocessing import cpu_count
THREADS = cpu_count()

# use this in explicit sql queries instead of "now()". SQLAlchemy models will handle
# it automatically via datetime.utcnow, but engine.execute("now()") will not be utc
utcnow = "TIMEZONE('utc', CURRENT_TIMESTAMP)"

def nowtz(tz='America/Los_Angeles'):
    return datetime.datetime.now(pytz.timezone(tz))
