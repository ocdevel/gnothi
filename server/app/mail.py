from app.utils import vars
from fastapi_mail import FastMail


def send_mail(email: str, token):
    # for more information about background-tasks see the link below
    # https://fastapi.tiangolo.com/tutorial/background-tasks/

    mail = FastMail(
        email=vars.EMAIL.EMAIL,
        password=vars.EMAIL.PASSWORD,
        tls=True,
        ssl=True,
        port="465",
        custom=True,
        services=vars.EMAIL.SERVER)

    body = f"""
    <html> 
    <body>
    <p>token: {token}</p> 
    </body> 
    </html>
    """

    mail.send_message(
        recipient=email,
        subject="testing HTML",
        body=body,
        text_format="html")
