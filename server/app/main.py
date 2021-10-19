import json
import logging
import os
import sqlalchemy as sa
import boto3
from utils.settings import settings, logger
import data.models as M
from data.db import engine, with_session
from botocore.exceptions import ClientError

def handle_connect(connection_id):
    """
    Handles new connections by adding the connection ID and user name to the
    DynamoDB table.

    :param user_name: The name of the user that started the connection.
    :param table: The DynamoDB connection table.
    :param connection_id: The websocket connection ID of the new connection.
    :return: An HTTP status code that indicates the result of adding the connection
             to the DynamoDB table.
    """
    status_code = 200
    try:
        with with_session() as sess:
            sess.execute(sa.text("""
            insert into ws_connections (connection_id, user_id) values (:cid, :uid)
            on conflict do nothing;
            """), {'cid': connection_id, 'uid': 'x'})
        logger.info("Added connection %s", connection_id)
    except ClientError:
        logger.exception("Couldn't add connection %s", connection_id)
        status_code = 503
    return status_code


def handle_disconnect(table, connection_id):
    return 200
    """
    Handles disconnections by removing the connection record from the DynamoDB table.

    :param table: The DynamoDB connection table.
    :param connection_id: The websocket connection ID of the connection to remove.
    :return: An HTTP status code that indicates the result of removing the connection
             from the DynamoDB table.
    """
    status_code = 200
    try:
        with with_session() as sess:
            sess.execute(sa.text("""
            delete from ws_connections where connection_id=:cid
            """), {'cid': connection_id})
        logger.info("Disconnected connection %s.", connection_id)
    except ClientError:
        logger.exception("Couldn't disconnect connection %s.", connection_id)
        status_code = 503
    return status_code


def handle_message(table, connection_id, event_body, apig_management_client):
    """
    Handles messages sent by a participant in the chat. Looks up all connections
    currently tracked in the DynamoDB table, and uses the API Gateway Management API
    to post the message to each other connection.

    When posting to a connection results in a GoneException, the connection is
    considered disconnected and is removed from the table. This is necessary
    because disconnect messages are not always sent when a client disconnects.

    :param table: The DynamoDB connection table.
    :param connection_id: The ID of the connection that sent the message.
    :param event_body: The body of the message sent from API Gateway. This is a
                       dict with a `msg` field that contains the message to send.
    :param apig_management_client: A Boto3 API Gateway Management API client.
    :return: An HTTP status code that indicates the result of posting the message
             to all active connections.
    """
    status_code = 200
    user_name = "guest"
    try:
        item_response = table.get_item(Key={"connection_id": connection_id})
        user_name = item_response["Item"]["user_name"]
        logger.info("Got user name %s.", user_name)
    except ClientError:
        logger.exception("Couldn't find user name. Using %s.", user_name)

    connection_ids = []
    try:
        scan_response = table.scan(ProjectionExpression="connection_id")
        connection_ids = [item["connection_id"] for item in scan_response["Items"]]
        logger.info("Found %s active connections.", len(connection_ids))
    except ClientError:
        logger.exception("Couldn't get connections.")
        status_code = 404

    message = f"{user_name}: {event_body['msg']}".encode("utf-8")
    logger.info("Message: %s", message)

    for other_conn_id in connection_ids:
        try:
            if other_conn_id != connection_id:
                send_response = apig_management_client.post_to_connection(
                    Data=message, ConnectionId=other_conn_id
                )
                logger.info(
                    "Posted message to connection %s, got response %s.",
                    other_conn_id,
                    send_response,
                )
        except ClientError:
            logger.exception("Couldn't post to connection %s.", other_conn_id)
        except apig_management_client.exceptions.GoneException:
            logger.info("Connection %s is gone, removing.", other_conn_id)
            try:
                table.delete_item(Key={"connection_id": other_conn_id})
            except ClientError:
                logger.exception("Couldn't remove connection %s.", other_conn_id)

    return status_code


def lambda_handler(event, context):
    """
    An AWS Lambda handler that receives events from an API Gateway websocket API
    and dispatches them to various handler functions.

    This function looks up the name of a DynamoDB table in the `table_name` environment
    variable. The table must have a primary key named `connection_id`.

    This function handles three routes: $connect, $disconnect, and sendmessage. Any
    other route results in a 404 status code.

    The $connect route accepts a query string `name` parameter that is the name of
    the user that originated the connection. This name is added to all chat messages
    sent by that user.

    :param event: A dict that contains request data, query string parameters, and
                  other data sent by API Gateway.
    :param context: Context around the request.
    :return: A response dict that contains an HTTP status code that indicates the
             result of handling the event.
    """
    route_key = event.get("requestContext", {}).get("routeKey")
    connection_id = event.get("requestContext", {}).get("connectionId")
    if route_key is None or connection_id is None:
        return {"statusCode": 400}

    response = {"statusCode": 200}
    if route_key == "$connect":
        response["statusCode"] = handle_connect(connection_id)
    elif route_key == "$disconnect":
        response["statusCode"] = handle_disconnect(connection_id)
    elif route_key == "$default":
        body = event.get("body", "NO MESSAGE")
        domain = event.get("requestContext", {}).get("domainName")
        stage = event.get("requestContext", {}).get("stage")
        if domain is None or stage is None:
            logger.warning(
                "Couldn't send message. Bad endpoint in request: domain '%s', "
                "stage '%s'",
                domain,
                stage,
            )
            response["statusCode"] = 400
        else:
            apig_management_client = boto3.client(
                "apigatewaymanagementapi", endpoint_url=settings.apig_endpoint
            )
            apig_management_client.post_to_connection(
                Data=body + "right back at yah",
                ConnectionId=connection_id,
            )

    else:
        response["statusCode"] = 404

    return response
