from flask import Flask
from jwtauthtest.database import init_db, shutdown_db_session

app = Flask(__name__)


@app.teardown_appcontext
def shutdown_session(exception=None):
    shutdown_db_session()


init_db()

import jwtauthtest.jwt
import jwtauthtest.views
