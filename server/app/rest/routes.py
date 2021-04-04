"""
Mostly legacy REST routes, want to move these to ws/*.py wherever possible.
Some can't go there (eg Stripe), some I don't know how yet (eg, file upload/download)
"""
import pdb, logging, boto3, shortuuid, io, stripe, json, os
from common.database import with_db, get_db
from fastapi import File, UploadFile, Depends, APIRouter, HTTPException, Response, Request
from urllib.parse import quote as urlencode
from app.rest.jwt import jwt_user
import sqlalchemy as sa
import pandas as pd
from fastapi.responses import StreamingResponse
from app.rest.utils import cant_snoop, send_error, getuser
import common.models as M
from app.singletons.ws import mgr
from app.singletons.app import app
from app.mail import send_mail
from common.database import with_db
from common.utils import vars
from common.pydantic.ws import MessageOut


logger = logging.getLogger(__name__)


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


@app.post("/upload-image")
async def upload_image_post(file: UploadFile = File(...)):
    s3 = boto3.client("s3")

    # https://github.com/tiangolo/fastapi/issues/1152
    # s3.put_object(Body=file.file, Bucket='gnothiai.com', ContentType=file.content_type, Key=f"images/{file.filename}")
    key = f"images/{shortuuid.uuid()}-{file.filename}"
    extra = {"ContentType": file.content_type}  # , "ACL": "public-read"}
    s3.upload_fileobj(file.file, "gnothiai.com", key, ExtraArgs=extra)
    url = "https://s3.amazonaws.com/gnothiai.com/"
    return {"filename": f"{url}{urlencode(key)}"}


@app.get('/field-entries/csv/{version}')
async def field_entries_csv(
    version: str,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user),
    db: sa.orm.Session = Depends(get_db)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop('Fields')
    if version not in ('new', 'old'):
        return send_error("table must be in (new|old)")

    m = {'new': M.FieldEntry, 'old': M.FieldEntryOld}[version]
    # Can't make direct query, since need field-name decrypted via sqlalchemy
    # https://stackoverflow.com/a/31300355/362790 - load_only from joined tables
    rows = db.query(m.created_at, m.value, M.Field) \
        .filter(m.user_id == viewer.id) \
        .join(M.Field, M.Field.id == m.field_id) \
        .order_by(m.created_at.asc()) \
        .all()
    # https://stackoverflow.com/a/61910803/362790
    df = pd.DataFrame([
        dict(name=f.name, date=date, value=value, type=f.type, excluded_at=f.excluded_at,
             default_value=f.default_value, default_value_value=f.default_value_value, service=f.service)
        for (date, value, f) in rows
    ])
    return StreamingResponse(io.StringIO(df.to_csv(index=False)), media_type="text/csv")


@app.post('/stripe/webhook')
async def stripe_webhook(request: Request):
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = vars.STRIPE_WEBHOOK_SECRET
    request_data = await request.json() # json.loads(request.data)
    request_body = await request.body()

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                payload=request_body, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            raise e
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        event_type = event['type']
    else:
        data = request_data['data']
        event_type = request_data['type']
    data_object = data['object']
    uid = data_object['metadata']['uid']

    logger.info('event ' + event_type)

    # FIXME use publish so if this is received on one server, but Websocket connected on another
    mgr.send(MessageOut(action='payments/payment/get', data=data, uids=[uid]))
    with with_db() as db:
        db.add(M.Payment(user_id=uid, event_type=event_type, data=data))
        if event_type == 'payment_intent.succeeded':
            # Fulfill any orders, e-mail receipts, etc
            # db.execute(text("update users set paid=true where id=:uid"), uid)
            logger.info("💰 Payment received!")
        if event_type == 'payment_intent.payment_failed':
            # TODO Notify the customer that their order was not fulfilled
            # db.execute(text("update users set paid=false where id=:uid"), uid)
            logger.error("❌ Payment failed.")
        db.commit()

    return {'status': 'success'}

nothing = None

