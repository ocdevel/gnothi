from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse


from app.app_app import app
from app.mail import send_mail
from app.google_analytics import ga
import common.models as M
from common.utils import vars

import stripe
import json
import os

stripe_router = APIRouter()

stripe.api_key = vars.STRIPE_SECRET_KEY
stripe.api_version = vars.STRIPE_API_VERSION


def product_details():
    return {
        'currency': 'USD',
        'amount': 500
    }


@stripe_router.get('/public-key')
def PUBLISHABLE_KEY():
    return {
        'publicKey': vars.STRIPE_PUBLISHABLE_KEY
    }


@stripe_router.get('/product-details')
def get_product_details():
    return product_details()


@stripe_router.post('/create-payment-intent')
def post_payment_intent():
    # Reads application/json and returns a response
    data = {}  # json.loads(request.data or '{}')

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


# @app.post('/stripe/webhook')
# def webhook_received():
#     # You can use webhooks to receive information about asynchronous payment events.
#     # For more about our webhook events check out https://stripe.com/docs/webhooks.
#     webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
#     request_data = json.loads(request.data)
#
#     if webhook_secret:
#         # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
#         signature = request.headers.get('stripe-signature')
#         try:
#             event = stripe.Webhook.construct_event(
#                 payload=request.data, sig_header=signature, secret=webhook_secret)
#             data = event['data']
#         except Exception as e:
#             return e
#         # Get the type of webhook event sent - used to check the status of PaymentIntents.
#         event_type = event['type']
#     else:
#         data = request_data['data']
#         event_type = request_data['type']
#     data_object = data['object']
#
#     print('event ' + event_type)
#
#     if event_type == 'payment_intent.succeeded':
#         # Fulfill any orders, e-mail receipts, etc
#         print("💰 Payment received!")
#
#     if event_type == 'payment_intent.payment_failed':
#         # Notify the customer that their order was not fulfilled
#         print("❌ Payment failed.")
#
#     return jsonify({'status': 'success'})
