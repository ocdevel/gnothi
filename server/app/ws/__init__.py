from box import Box

from app.ws.auth import Auth, decode_jwt
from app.ws.users import Users
from app.ws.groups import Groups
from app.ws.insights import Insights
from app.ws.entries import Entries
from app.ws.tags import Tags
from app.ws.fields import Fields
from app.ws.habitica import Habitica
from app.ws.shares import Shares
from app.ws.notifs import Notifs
from app.ws.payments import Payments

handlers = Box(
    auth=Auth,
    groups=Groups,
    users=Users,
    insights=Insights,
    entries=Entries,
    tags=Tags,
    fields=Fields,
    habitica=Habitica,
    shares=Shares,
    notifs=Notifs,
    payments=Payments
)
