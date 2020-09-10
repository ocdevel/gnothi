from app.app_app import app as app_
import app.app_jwt
import app.app_routes
from common.utils import is_dev

app = app_

if __name__ == "__main__":
    args_ = {'debug': True} if is_dev() else {'port': 80}
    app.run(host='0.0.0.0', **args_)
