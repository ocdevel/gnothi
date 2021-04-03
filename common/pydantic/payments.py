from typing import Optional, Any, Dict
from pydantic import UUID4
import datetime
from enum import Enum
from common.pydantic.utils import BM, BM_ORM


class PublicKey(BM):
    publicKey: str


class Products(Enum):
    create_group = 'create_group'


class ProductPost(BM):
    product: Products


class ProductGet(BM):
    currency: str
    amount: int

