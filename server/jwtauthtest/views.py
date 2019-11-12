from flask_jwt import jwt_required
from jwtauthtest import app


@app.route('/hello')
@jwt_required()
def hello():
    return 'Hello world!'
