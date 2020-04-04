#!/bin/sh
FLASK_APP=jwtauthtest FLASK_ENV=development WIPE=1 flask run --host=0.0.0.0
