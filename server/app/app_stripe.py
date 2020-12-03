import pdb, stripe, json, os
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse

from fastapi_sqlalchemy import db
from app.app_app import app
from app.app_jwt import jwt_user
from app.mail import send_mail
from app.google_analytics import ga
import common.models as M
from sqlalchemy import text
from common.utils import vars

import logging
logger = logging.getLogger(__name__)

stripe_router = APIRouter()

stripe.api_key = vars.STRIPE_SECRET_KEY
stripe.api_version = vars.STRIPE_API_VERSION


def product_details():
    return {
        'currency': 'USD',
        'amount': 500
    }


@stripe_router.get('/public-key')
def PUBLISHABLE_KEY(viewer: M.User = Depends(jwt_user)):
    return {
        'publicKey': vars.STRIPE_PUBLISHABLE_KEY
    }


@stripe_router.get('/product-details')
def get_product_details():
    return product_details()


@stripe_router.post('/create-payment-intent')
def post_payment_intent(viewer: M.User = Depends(jwt_user)):
    # Reads application/json and returns a response
    data = {'metadata': {'uid': str(viewer.id)}}  # json.loads(request.data or '{}')

    product = product_details()

    options = dict()
    options.update(data)
    options.update(product)

    # Create a PaymentIntent with the order amount and currency
    payment_intent = stripe.PaymentIntent.create(**options)

    try:
        return payment_intent
    except Exception as e:
        raise HTTPException(status_code=403, detail=e)


@app.post('/stripe/webhook')
async def webhook_received(request: Request):
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
    uid = {'uid': data_object['metadata']['uid']}

    logger.info('event ' + event_type)

    if event_type == 'payment_intent.succeeded':
        # Fulfill any orders, e-mail receipts, etc
        db.session.execute(text("update users set paid=true where id=:uid"), uid)
        db.session.commit()
        logger.info("💰 Payment received!")

    if event_type == 'payment_intent.payment_failed':
        # TODO Notify the customer that their order was not fulfilled
        db.session.execute(text("update users set paid=false where id=:uid"), uid)
        db.session.commit()
        logger.error("❌ Payment failed.")

    return {'status': 'success'}
