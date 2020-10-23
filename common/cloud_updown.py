from common.utils import is_dev, vars
from common.database import session
import common.models as M
import boto3
import logging
from uuid import uuid4
logger = logging.getLogger(__name__)

def cloud_up_maybe():
    if is_dev(): return
    with session() as sess:
        if M.User.last_checkin(sess) > 15: return
        if M.Machine.gpu_status(sess) in ("on", "pending"): return

        logger.warning("Initing AWS Batch")
        M.Machine.notify_online(sess, 'batch', 'pending')
        boto3.client('batch').submit_job(
            jobName=str(uuid4()),
            jobQueue='gnothi-jq',
            jobDefinition='gnothi-jd',
        )


def cloud_down_maybe(sess):
    if is_dev(): return

    # 15 minutes since last user checkin
    active = M.User.last_checkin(sess) < 15
    if active or vars.MACHINE in ['desktop', 'laptop']:
        return

    sess.query(M.Machine).filter_by(id=vars.MACHINE).delete()
    sess.commit()
    exit(0)
