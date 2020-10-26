import os, pytz, datetime, socket, pdb
from dynaconf import Dynaconf

DROP_SQL = 'DROP SCHEMA public CASCADE;CREATE SCHEMA public;'

# load configs. Priority = config.example.yml -> config.yml -> env_vars
vars = Dynaconf(
    settings_files=['common/config.example.yml', 'common/config.yml'],
    # environments=True
)

# Dynaconf requires an env-vars prefix (like DYNACONF_DB_URL), I'll move to that later; in mean-time,
# manually pulling in env vars
for k, v in vars.items():
    v = os.environ.get(k, v)  # fall back to dynaconf val if not provided as env_var
    vars[k] = v
    # Boto3 wants env vars, can't find way to set via sdk
    if k and v and k.startswith("AWS_") and not os.environ.get(k, False):
        os.environ[k] = v

# TODO switch to Dynaconf's layered environment feature https://www.dynaconf.com/configuration/#environments
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
