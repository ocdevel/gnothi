from common.utils import vars, is_dev
import boto3

url = "http://localhost:3002" if is_dev() else "https://gnothiai.com"

def send_mail(email, type, data):
    if is_dev(): return
    if type == 'forgot-password':
        body = f"Click this link to confirm your account: {url}/reset-password?token={data}"
    elif type == 'welcome':
        body = f"Thank you for registering a Gnothi account! Start journaling away."
    else: return

    ses = boto3.client('ses')
    ses.send_email(
        Source=vars.EMAIL.SES_EMAIL_SOURCE,
        Destination={'ToAddresses': [email]},
        Message={
            'Subject': {'Data': 'Confirm Your Account'},
            'Body': {
                'Text': {'Data': body}
            }
        }
    )
