import pdb, stripe, json, os
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from typing import Dict
from common.pydantic.utils import BM
import common.pydantic.payments as PyP

from app.app_app import app
from app.app_jwt import jwt_user
from app.mail import send_mail
from common.database import with_db
import common.models as M
from sqlalchemy import text
from common.utils import vars

import logging
logger = logging.getLogger(__name__)

stripe_router = APIRouter()

stripe.api_key = vars.STRIPE_SECRET_KEY
stripe.api_version = vars.STRIPE_API_VERSION


class Payments:
    @staticmethod
    def _products(k):
        return {
            PyP.Products.create_group: dict(
                currency='USD',
                amount=2900
            )
        }[k]

    @staticmethod
    async def on_public_key_get(data: BM, d) -> PyP.PublicKey:
        return {'publicKey': vars.STRIPE_PUBLISHABLE_KEY}

    @staticmethod
    async def on_product_get(data: PyP.ProductPost, d) -> PyP.ProductGet:
        return Payments._products(data.product)

    @staticmethod
    async def on_payment_intent_post(data: PyP.ProductPost, d) -> Dict:
        # Create a PaymentIntent with the order amount and currency
        return stripe.PaymentIntent.create(
            metadata=dict(
                uid=str(d.vid),
                product=data.product.value
            ),
            **Payments._products(data.product)
        )


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

payments_router = {}
