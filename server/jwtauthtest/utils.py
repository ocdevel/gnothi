import json, os
from sqlalchemy import create_engine, text
from sqlalchemy_utils import database_exists, create_database
from box import Box

def join_(paths):
    return os.path.join(os.path.dirname(__file__), *paths)

config_json = json.load(open(join_(['config.json'])))
vars = {}
for k in ['DB_URL', 'DB_PROD_URL', 'DB_NAME', 'DB_PROD_NAME']:
    vars[k] = os.environ.get(k, config_json.get(k, None))

if os.environ.get('PROD_DB', False):
    vars['DB_URL'] = vars['DB_PROD_URL']
    vars['DB_NAME'] = vars['DB_PROD_NAME']

vars = Box(vars)
vars['DB_URL'] = f"{vars.DB_URL}/{vars.DB_NAME}"
vars['DB_PROD_URL'] = f"{vars.DB_PROD_URL}/{vars.DB_PROD_NAME}"
print(vars.DB_URL)
