import pdb
from app.app_app import app as app_
import app.app_jwt
import app.app_routes
import app.app_cron
from app.utils import is_dev

# FIXME app.run tries to access module? "AttributeError: module 'app' has no attribute 'run'"
app = app_

if __name__ == "__main__":
    args_ = {'debug': True} if is_dev() else {'port': 80}
    app.run(host='0.0.0.0', **args_)
