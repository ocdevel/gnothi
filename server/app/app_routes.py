import pdb, logging
from common.database import with_db
from app.app_app import app
from app.routes.users import users_router
from app.routes.stripe import stripe_router
from app.routes.groups import groups_router
from app.routes.auth import auth_router
import sqlalchemy as sa

logger = logging.getLogger(__name__)

app.include_router(stripe_router, prefix='/stripe')


@app.get('/health')
def health_get():
    return {'ok': True}


@app.get('/stats')
def stats_get():
    with with_db() as db:
        exec = db.session.execute
        users = exec("select count(*) ct from users").fetchone().ct
        therapists = exec("select count(*) ct from users where therapist=true").fetchone().ct
        books = exec("""
        select s.shelf
        from books b
        inner join bookshelf s on b.id=s.book_id
        inner join users u on u.id=s.user_id
        where s.shelf not in ('ai', 'cosine')
            and u.is_superuser is not true
            and b.amazon is null
        order by s.created_at desc;
        """).fetchall()
        return dict(
            users=users,
            therapists=therapists,
            upvotes=sum([1 for b in books if b.shelf in ('like', 'already_read', 'recommend')]),
            downvotes=sum([1 for b in books if b.shelf in ('dislike', 'remove')]),
        )
