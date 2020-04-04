#!/bin/sh
export JWT_SECRET_KEY="my jwt secret key"
export FLASK_APP=jwtauthtest
export FLASK_ENV=development
WIPE=1 flask run --host=0.0.0.0
#flask run --host=0.0.0.0
