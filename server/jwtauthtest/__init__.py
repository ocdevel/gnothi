from flask import Flask
from flask_cors import CORS
from jwtauthtest.database import init_db, shutdown_db_session
from jwtauthtest.utils import vars

app = Flask(__name__)
app.secret_key = vars.FLASK_KEY
CORS(app)


@app.teardown_appcontext
def shutdown_session(exception=None):
    shutdown_db_session()


init_db()

import jwtauthtest.jwt
import jwtauthtest.views
