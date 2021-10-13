# Docs: https://registry.terraform.io/modules/terraform-aws-modules/apigateway-v2/aws/latest
# http: https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2/blob/master/examples/complete-http/main.tf
# vpc-link: https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2/blob/master/examples/vpc-link-http/main.tf
# websocket: https://github.com/lllama/terraform-aws-apigateway-v2/tree/complete-websocket/examples/complete-websocket

module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name                       = "${local.name}-apig"
  description                = "${local.name} AWS Websocket API Gateway"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  create_api_domain_name = false

  default_stage_access_log_destination_arn = aws_cloudwatch_log_group.apig_logs.arn
  default_stage_access_log_format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"

  integrations = {
    "$connect" = {
      lambda_arn = module.lambda_function.lambda_function_invoke_arn
    },
    "$disconnect" = {
      lambda_arn = module.lambda_function.lambda_function_invoke_arn
    },
    "$default" = {
      lambda_arn = module.lambda_function.lambda_function_invoke_arn
    }

  }

  tags = local.tags
}

output "execute_uri" {
  value = module.api_gateway.default_apigatewayv2_stage_invoke_url
}
