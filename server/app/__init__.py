from flask import Flask
from flask_cors import CORS
from app.database import init_db, shutdown_db_session
from app.utils import vars

app = Flask(__name__)
app.secret_key = vars.FLASK_KEY
CORS(app)

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.WARNING)

# Remove sessions since we're using JWT. See https://flask-login.readthedocs.io/en/latest/#disabling-session-cookie-for-apis
from flask.sessions import SecureCookieSessionInterface
class CustomSessionInterface(SecureCookieSessionInterface):
    """Prevent creating session from API requests."""
    def save_session(self, *args, **kwargs): return
app.session_interface = CustomSessionInterface()


@app.teardown_appcontext
def shutdown_session(exception=None):
    shutdown_db_session()


init_db()
