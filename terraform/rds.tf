locals {
  name_ = replace(local.name, "-", "_")  # certain rds attrs can't contain -
  db_username           = random_pet.users.id # using random here due to secrets taking at least 7 days before fully deleting from account
  db_password           = random_password.password.result
}

resource "random_pet" "users" {
  length    = 2
  separator = "_"
}

resource "random_password" "password" {
  length  = 30
  special = false
}

module "lambda_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4"

  name        = "${local.name}-lambda"
  description = "Lambda RDS Proxy example security group"
  vpc_id      = module.vpc.vpc_id

  egress_rules = ["all-all"]

  tags = local.tags
}

module "rds_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4"

  name        = "${local.name}-rds_proxy"
  description = "PostgreSQL RDS Proxy example security group"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      description = "Private subnet PostgreSQL access"
      rule        = "postgresql-tcp"
      cidr_blocks = join(",", module.vpc.private_subnets_cidr_blocks)
    }
  ]

  egress_with_cidr_blocks = [
    {
      description = "Database subnet PostgreSQL access"
      rule        = "postgresql-tcp"
      cidr_blocks = join(",", module.vpc.database_subnets_cidr_blocks)
    },
  ]

  tags = local.tags
}

module "rds" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 5.0"

  name              = "${local.name}-rds"
  engine            = "aurora-postgresql"
  engine_mode       = "serverless"
  storage_encrypted = true

  database_name = "${local.name_}_db"
  username      = local.db_username
  password      = local.db_password
#
#  # When using RDS Proxy w/ IAM auth - Database must be username/password auth, not IAM
#  iam_database_authentication_enabled = false

  vpc_id                = module.vpc.vpc_id
  subnets               = module.vpc.database_subnets
  create_security_group = false
  vpc_security_group_ids = [module.rds_sg.security_group_id]
  allowed_cidr_blocks   = module.vpc.private_subnets_cidr_blocks

  replica_scale_enabled = false
  replica_count         = 0

  monitoring_interval = 60

  apply_immediately   = true
  skip_final_snapshot = true

  db_parameter_group_name         = aws_db_parameter_group.db_params_postgresql.id
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.cluster_params_postgresql.id
  # enabled_cloudwatch_logs_exports = # NOT SUPPORTED

  enable_http_endpoint = true

  scaling_configuration = {
    auto_pause               = true
    min_capacity             = 2
    max_capacity             = 8
    seconds_until_auto_pause = 300
    timeout_action           = "ForceApplyCapacityChange"
  }
}

resource "aws_db_parameter_group" "db_params_postgresql" {
  name        = "${local.name}-aurora-db-postgres-parameter-group"
  family      = "aurora-postgresql10"
  description = "${local.name}-aurora-db-postgres-parameter-group"
  tags        = local.tags
}

resource "aws_rds_cluster_parameter_group" "cluster_params_postgresql" {
  name        = "${local.name}-aurora-postgres-cluster-parameter-group"
  family      = "aurora-postgresql10"
  description = "${local.name}-aurora-postgres-cluster-parameter-group"
  tags        = local.tags
}
