# Docs: https://registry.terraform.io/modules/terraform-aws-modules/lambda/aws/latest
# VPC config:
# - https://www.serverless.com/framework/docs/providers/aws/guide/functions#vpc-configuration
# - https://docs.aws.amazon.com/lambda/latest/dg/services-rds-tutorial.html

module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "${local.name}-lambda"
  description   = "${local.name} main lambda function"
  handler       = "app.main.lambda_handler"
  runtime       = "python3.8"

  publish = true

  source_path = "../server"

  # https://stackoverflow.com/a/68704087
  layers = ["arn:aws:lambda:us-east-1:898466741470:layer:psycopg2-py38:2"]

  attach_network_policy  = true
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [module.lambda_sg.security_group_id]

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
    secrets = {
      effect = "Allow",
      actions = ["secretsmanager:GetSecretValue"],
      resources = [aws_secretsmanager_secret.rds.arn]
    }
    #rds_proxy = {
    #  #effect = "Allow",
    #  actions   = ["rds-db:connect"]
    #  resources = ["${local.db_iam_connect_prefix}/${local.db_username}"]
    #}
  }

  environment_variables = {
    secret_id = aws_secretsmanager_secret.rds.id
    secret_name = aws_secretsmanager_secret.rds.name
#    endpoint = module.rds_proxy.proxy_endpoint
    endpoint = module.rds.rds_cluster_endpoint
    database = module.rds.rds_cluster_database_name
  }

  tags = local.tags
}

module "lambda_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4.0"

  name        = "${local.name}-lambda-sg"
  description = "Lambda security group for example usage"
  vpc_id      = module.vpc.vpc_id

  egress_rules = ["all-all"]
  egress_cidr_blocks = ["0.0.0.0/0"]

  tags = local.tags
}

output "rds_endpoints" {
  value = module.rds.rds_cluster_instance_endpoints
}

