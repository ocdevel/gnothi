from flask import Flask
from flask_cors import CORS
from jwtauthtest.database import init_db, shutdown_db_session

app = Flask(__name__)
CORS(app)


@app.teardown_appcontext
def shutdown_session(exception=None):
    shutdown_db_session()


init_db()

import jwtauthtest.jwt
import jwtauthtest.views
