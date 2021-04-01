import pdb, re, datetime, logging, boto3, io
from typing import Dict, List, Any
from common.database import with_db
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


class JWTIn(BaseModel):
    jwt: str


class SIEmail(BaseModel):
    email: str


class SILogin(SIEmail):
    password: str


class Auth:
    @staticmethod
    def _get_cognito_user(token):
        # claims = decode_jwt(token)
        res = cognito_client.get_user(AccessToken=token)
        return dict(
            id=res['Username'],
            email=next(x['Value'] for x in res['UserAttributes'] if x['Name'] == 'email')
        )

    @staticmethod
    def _create_user(db, cog_id, email):
        # ga(user.id, 'user', 'register')
        user = M.User(cognito_id=cog_id, email=email)
        t = M.Tag(user=user, main=True, selected=True, name='Main')
        db.add(t)
        db.commit()
        db.refresh(user)
        return user.id

    @staticmethod
    def _cognito_to_uid(token):
        claims = decode_jwt(token)
        cog_id = claims['sub']
        with with_db() as db:
            uid = db.query(M.User.id).filter_by(cognito_id=cog_id).scalar()
            if uid: return uid
            cog_user = Auth._get_cognito_user(token)
            email, cog_id = cog_user['email'], cog_user['id']
            user = db.query(M.User).filter_by(email=email).first()
            if not user:
                return Auth._create_user(db, cog_id, email)
            user.cognito_id = cog_id
            db.commit()
            return user.id


    async def jwt(self, data: JWTIn, d) -> BaseModel:
        res = d.db.execute("select 1").first()
        return {}


    @staticmethod
    async def _migrate_user(db, email, password=None):
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

    @staticmethod
    async def on_old_login(data: SILogin, d) -> Dict:
        user = d.db.query(M.User).filter_by(email=data.email)\
            .with_entities(M.User.email, M.User.hashed_password)\
            .filter(M.User.hashed_password.isnot(None))\
            .first()
        if not user:
            return dict(notexists=True)
        verified, _ = pwd_context.verify_and_update(data.password, user.hashed_password)
        if not verified:
            return dict(wrong=True)
        await Auth.migrate_user(d.db, data.email, data.password)
        return dict(migrated=True)

    @staticmethod
    async def on_old_password_reset(data: SIEmail, d) -> Dict:
        user = d.db.query(M.User).filter_by(email=data.email) \
            .with_entities(M.User.email) \
            .first()
        if not user:
            return dict(notexists=False)
        await Auth.migrate_user(d.db, data.email)
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
