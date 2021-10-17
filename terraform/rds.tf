# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/master/examples/postgresql/main.tf

resource "random_password" "master" {
  length = 10
}

module "aurora" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 5.0"

  name                  = "${local.name}-psql"
  engine                = "aurora-postgresql"
  engine_version        = "11.9"
  instance_type         = "db.t3.medium"

  vpc_id                = module.vpc.vpc_id
  db_subnet_group_name  = module.vpc.database_subnet_group_name
  create_security_group = true
  allowed_cidr_blocks   = module.vpc.private_subnets_cidr_blocks

  replica_count                       = 1
  #iam_database_authentication_enabled = true
  password                            = random_password.master.result
  create_random_password              = false

  storage_encrypted   = true
  apply_immediately   = true
  skip_final_snapshot = true

#  db_parameter_group_name         = "default"
#  db_cluster_parameter_group_name = "default"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = local.tags
}

# https://aws.amazon.com/blogs/compute/using-amazon-rds-proxy-with-aws-lambda/
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret_version
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_proxy

# https://aws.plainenglish.io/have-your-lambda-functions-connect-to-rds-through-rds-proxy-c94072560eee
# https://github.com/clowdhaus/terraform-aws-rds-proxy

resource "aws_db_proxy_default_target_group" "rds_proxy_target_group" {
  db_proxy_name = aws_db_proxy.db_proxy.name

  connection_pool_config {
    connection_borrow_timeout = 120
    max_connections_percent = 100
  }
}

resource "aws_db_proxy_target" "rds_proxy_target" {
#  db_instance_identifier = aws_db_instance.database.id # FIXME
  db_cluster_identifier = module.aurora.rds_cluster_id
  db_proxy_name          = aws_db_proxy.db_proxy.name
  target_group_name      = aws_db_proxy_default_target_group.rds_proxy_target_group.name
}

resource "aws_db_proxy" "db_proxy" {
  debug_logging          = false
  engine_family          = "POSTGRES"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy_iam_role.arn
  vpc_security_group_ids = [aws_security_group.sg_rds_proxy.id]
  vpc_subnet_ids         = module.vpc.database_subnets

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "REQUIRED"
    secret_arn  = aws_secretsmanager_secret.rds_secret.arn
  }
}
