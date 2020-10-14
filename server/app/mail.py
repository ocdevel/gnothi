from common.utils import vars, is_dev
import boto3

url = "http://localhost:3002" if is_dev() else "https://gnothiai.com"

def send_mail(email, type, data):
    if is_dev(): return
    if type == 'forgot-password':
        subject = "Gnothi reset password"
        body = f"Click this link to reset your password: {url}/reset-password?token={data}"
    elif type == 'welcome':
        subject = "Welcome to Gnothi"
        body = f"Thank you for registering a Gnothi account! Start journaling away."
    elif type == 'action':
        subject = f"Gnothi: {data['category']}/{data['action']}"
        body = subject
    else: return

    ses = boto3.client('ses')
    ses.send_email(
        Source=vars.EMAIL_SES_EMAIL_SOURCE,
        Destination={'ToAddresses': [email]},
        Message={
            'Subject': {'Data': subject},
            'Body': {
                'Text': {'Data': body}
            }
        }
    )
