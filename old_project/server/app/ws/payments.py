import pdb, stripe, json, os
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from typing import Dict
from common.pydantic.utils import BM
import common.pydantic.payments as PyP

from app.singletons.app import app
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

payments_router = {}
