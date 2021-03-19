from pydantic import BaseModel, UUID4
import orjson


def orjson_dumps(v, *, default):
    # orjson.dumps returns bytes, to match standard json.dumps we need to decode
    return orjson.dumps(v, default=default).decode()


class BM(BaseModel):
    class Config:
        json_loads = orjson.loads
        json_dumps = orjson_dumps


class BM_ID(BM):
    id: UUID4


class BM_ORM(BaseModel):
    class Config:
        json_loads = orjson.loads
        json_dumps = orjson_dumps
        orm_mode = True
