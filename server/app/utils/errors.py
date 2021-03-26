class GnothiException(Exception):
    def __init__(self, code, error, detail):
        self.code = code
        self.error = error
        self.detail = detail
        super().__init__(detail)


class CantSnoop(GnothiException):
    def __init__(self, detail="Can't access this user's feature"):
        super().__init__(401, "CANT_SNOOP", detail)


class JWTError(GnothiException):
    def __init__(self):
        super().__init__(401, "JWT_EXPIRED", "JWT Expired")


class NotFound(GnothiException):
    def __init__(self, detail=""):
        super().__init__(404, "NOT_FOUND", detail)


class CantInteract(GnothiException):
    def __init__(self, detail="You don't have permissions for this group"):
        super().__init__(401, "CANT_INTERACT", detail)


class AIOffline(GnothiException):
    def __init__(self, detail="AI server offline, check back later"):
        super().__init__(200, "JOBS_OFFLINE", detail)


class InvalidJwt(GnothiException):
    def __init__(self, detail="Invalid JWT for authentication"):
        super().__init__(401, "INVALID_JWT", detail)
