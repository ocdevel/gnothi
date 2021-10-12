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

  vpc_links = {
    my-vpc = {
      name               = "${local.name}-apig-vcp-link"
      security_group_ids = [module.api_gateway_security_group.security_group_id]
      subnet_ids         = module.vpc.public_subnets
    }
  }

  tags = local.tags
}

output "execute_uri" {
  value = module.api_gateway.default_apigatewayv2_stage_invoke_url
}

module "api_gateway_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.0"

  name        = "${local.name}-apig-sg"
  description = "API Gateway group for example usage"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["https-443-tcp","http-80-tcp"]

  egress_rules = ["all-all"]
}
