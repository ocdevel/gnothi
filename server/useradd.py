import click

from jwtauthtest.database import db_session
from jwtauthtest.models import User
from passlib.hash import pbkdf2_sha256


@click.command()
@click.option('--username', prompt='Enter the username',
              help='The name of the user')
@click.option('--password', prompt='Enter the password',
              confirmation_prompt=True, hide_input=True,
              help='The password of the user')
def useradd(username, password):
    db_session.add(User(username, pbkdf2_sha256.hash(password)))
    db_session.commit()


if __name__ == '__main__':
    useradd()
