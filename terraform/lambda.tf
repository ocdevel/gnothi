module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${local.name}-lambda"
  description   = "${local.name} main lambda function"
  handler       = "handler.lambda_handler"
  runtime       = "python3.8"

  publish = true

  source_path = "./handler"

  attach_network_policy  = true
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [module.lambda_security_group.security_group_id]

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.apigatewayv2_api_execution_arn}/*/*"
    }
  }

  attach_policy_statements = true
  policy_statements = {
    manage_connections = {
      effect    = "Allow",
      actions   = ["execute-api:ManageConnections"],
      resources = ["${module.api_gateway.default_apigatewayv2_stage_execution_arn}/*"]
    }
    dynamodb = {
      effect    = "Allow",
      actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"],
      resources = [module.dynamodb_table.dynamodb_table_arn]
    }

  }

}

module "lambda_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.0"

  name        = "${local.name}-lambda-sg"
  description = "Lambda security group for example usage"
  vpc_id      = module.vpc.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      rule                     = "https-443-tcp"
      source_security_group_id = module.api_gateway_security_group.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1

  egress_rules = ["all-all"]
}
