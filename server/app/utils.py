from fastapi import HTTPException
import common.models as M


def send_error(message: str, code: int = 400):
    raise HTTPException(status_code=code, detail=message)


def cant_snoop(feature=None):
    message = f"{feature} isn't shared" if feature else "This feature isn't shared"
    return send_error(message, 401)

getuser = M.User.snoop
