locals {
  db_name               = "${local.name}-db"
  db_username           = random_pet.users.id # using random here due to secrets taking at least 7 days before fully deleting from account
  db_password           = random_password.password.result
  db_proxy_resource_id  = element(split(":", module.rds_proxy.proxy_arn), 6)
  db_iam_connect_prefix = "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${local.db_proxy_resource_id}"
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

################################################################################
# Supporting Resources
################################################################################

resource "random_pet" "users" {
  length    = 2
  separator = "_"
}

resource "random_password" "password" {
  length  = 16
  special = false
}

module "rds" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 5"

  name          = local.name
  database_name = local.db_name
  username      = local.db_username
  password      = local.db_password

  # When using RDS Proxy w/ IAM auth - Database must be username/password auth, not IAM
  iam_database_authentication_enabled = false

  engine              = "aurora-postgresql"
  engine_version      = "11.9"
  replica_count       = 1
  instance_type       = "db.t3.medium"
  storage_encrypted   = true
  apply_immediately   = true
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  create_monitoring_role          = true

  vpc_id                 = module.vpc.vpc_id
  subnets                = module.vpc.database_subnets
  create_security_group  = false
  vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]

  db_subnet_group_name            = local.name # Created by VPC module
  db_parameter_group_name         = aws_db_parameter_group.aurora_db_postgres11_parameter_group.id
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora_cluster_postgres11_parameter_group.id

  tags = local.tags
}

resource "aws_db_parameter_group" "aurora_db_postgres11_parameter_group" {
  name        = "${local.name}-aurora-db-postgres11-parameter-group"
  family      = "aurora-postgresql11"
  description = "test-aurora-db-postgres11-parameter-group"

  tags = local.tags
}

resource "aws_rds_cluster_parameter_group" "aurora_cluster_postgres11_parameter_group" {
  name        = "${local.name}-aurora-postgres11-cluster-parameter-group"
  family      = "aurora-postgresql11"
  description = "${local.name}-aurora-postgres11-cluster-parameter-group"

  tags = local.tags
}
