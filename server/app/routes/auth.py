import pdb, re, datetime, logging, boto3, io
from app.app_app import app
from app.app_jwt import jwt_user
from fastapi import Depends
from sqlalchemy.orm import Session
from common.database import get_db
import sqlalchemy as sa
import common.models as M
from passlib.context import CryptContext
from pydantic import BaseModel

cognito_client = boto3.client('cognito-idp')
region = 'us-east-1'
userpool_id = 'us-east-1_Tsww98VBH'
app_client_id = '5rh3bkhtmcskqer9t17gg5fn65'
keys_url = 'https://cognito-idp.{}.amazonaws.com/{}/.well-known/jwks.json'.format(region, userpool_id)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)
S = "server/auth"
C = "client/auth"


def get_cognito_user(token):
    # claims = decode_jwt(token)
    return cognito_client.get_user(AccessToken=token)


class JWT(BaseModel):
    jwt: str


@app.post("/cognito")
async def on_cognito(data: JWT):
    print(get_cognito_user(data.jwt))


async def migrate_user(db, email, password=None):
    response = cognito_client.admin_create_user(
        UserPoolId=userpool_id,
        Username=email,
        UserAttributes=[
            dict(Name='email', Value=email)
        ],
        MessageAction='SUPPRESS' if password else 'RESEND',
    )
    cognito_id = response['User']['Username']
    db.execute(sa.text("""
    update users set cognito_id=:cognito_id, password=null
    where email=:email
    """), cognito_id=cognito_id, email=email)
    db.commit()
    if not password:
        return
    return cognito_client.admin_set_user_password(
        UserPoolId=userpool_id,
        Username=cognito_id,
        Password=password,
        Permanent=True
    )


class SIEmail(BaseModel):
    email: str


class SILogin(SIEmail):
    password: str


@app.post("/auth/old/login")
async def auth_old_login(data: SILogin, db: Session = Depends(get_db)):
    user = db.query(M.User).filter_by(email=data.email)\
        .with_entities(M.User.email, M.User.hashed_password)\
        .filter(M.User.hashed_password.isnot(None))\
        .first()
    if not user:
        return dict(notexists=True)
    verified, _ = pwd_context.verify_and_update(data.password, user.hashed_password)
    if not verified:
        return dict(wrong=True)
    await migrate_user(db, data.email, data.password)
    return dict(migrated=True)


@app.post("/auth/old/reset-password")
async def auth_old_reset(data: SIEmail, db: Session = Depends(get_db)):
    user = db.query(M.User).filter_by(email=data.email) \
        .with_entities(M.User.email) \
        .first()
    if not user:
        return dict(notexists=False)
    await migrate_user(db, data.email)
    return dict(migrated=True)


auth_router = {}

"""
Adapted from
https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.py
Will remove much of this after fully migrated to Cognito
"""

import json, time
import urllib.request
from jose import jwk, jwt
from jose.utils import base64url_decode

# instead of re-downloading the public keys every time
# we download them only on cold start
# https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/
with urllib.request.urlopen(keys_url) as f:
    response = f.read()
keys = json.loads(response.decode('utf-8'))['keys']


def decode_jwt(token, verify_aud=False):
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(keys)):
        if kid == keys[i]['kid']:
            key_index = i
            break
    if key_index == -1:
        print('Public key not found in jwks.json')
        return False
    # construct the public key
    public_key = jwk.construct(keys[key_index])
    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit('.', 1)
    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        print('Signature verification failed')
        return False
    print('Signature successfully verified')
    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)

    # additionally we can verify the token expiration
    if time.time() > claims['exp']:
        print('Token is expired')
        return False

    if verify_aud:
        # and the Audience  (use claims['client_id'] if verifying an access token)
        if claims['aud'] != app_client_id:
            print('Token was not issued for this audience')
            return False

    # now we can use the claims
    print(claims)
    return claims
