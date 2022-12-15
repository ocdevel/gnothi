from app.mail import send_mail
from common.database import with_db
import common.models as M


def on_after_register(user):
    #ga(user.id, 'user', 'register')
    with with_db() as db:
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.add(t)
        db.commit()
    send_mail(user.email, "welcome", {})
