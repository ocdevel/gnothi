locals {
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

module "aurora_postgresql" {
  source = "terraform-aws-modules/rds-aurora/aws"

  name              = "${local.name}-postgresql"
  engine            = "aurora-postgresql"
  engine_mode       = "serverless"
  storage_encrypted = true

  database_name = replace(local.name, "-", "_")
  username      = local.db_username
  password      = local.db_password
  create_random_password = false

  vpc_id                = module.vpc.vpc_id
  subnets               = module.vpc.database_subnets
  create_security_group = true
  allowed_cidr_blocks   = module.vpc.private_subnets_cidr_blocks

  monitoring_interval = 60

  apply_immediately   = true
  skip_final_snapshot = true

  db_parameter_group_name         = aws_db_parameter_group.example_postgresql.id
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.example_postgresql.id
  # enabled_cloudwatch_logs_exports = # NOT SUPPORTED

  scaling_configuration = {
    auto_pause               = true
    min_capacity             = 2
    max_capacity             = 16
    seconds_until_auto_pause = 300
    timeout_action           = "ForceApplyCapacityChange"
  }

  tags = local.tags
}

resource "aws_db_parameter_group" "example_postgresql" {
  name        = "${local.name}-aurora-db-postgres-parameter-group"
  family      = "aurora-postgresql10"
  description = "${local.name}-aurora-db-postgres-parameter-group"
  tags        = local.tags
}

resource "aws_rds_cluster_parameter_group" "example_postgresql" {
  name        = "${local.name}-aurora-postgres-cluster-parameter-group"
  family      = "aurora-postgresql10"
  description = "${local.name}-aurora-postgres-cluster-parameter-group"
  tags        = local.tags
}
