import pdb, re, datetime, logging, boto3, io
from typing import Dict, List, Any
from common.database import with_db
import sqlalchemy as sa
import common.models as M
from passlib.context import CryptContext
from pydantic import BaseModel
from common.seed import GROUP_ID


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
        ug = M.UserGroup(user=user, group_id=GROUP_ID)
        db.add_all([t, ug])
        db.commit()
        return db.query(M.User.id).filter_by(email=email).scalar()

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


auth_router = {}

