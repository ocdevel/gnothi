locals {
  db_username           = random_pet.users.id # using random here due to secrets taking at least 7 days before fully deleting from account
  db_password           = random_password.password.result
#  db_proxy_resource_id  = element(split(":", module.rds_proxy.proxy_arn), 6)
#  db_iam_connect_prefix = "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${local.db_proxy_resource_id}"
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

resource "random_pet" "users" {
  length    = 2
  separator = "_"
}

resource "random_password" "password" {
  length  = 30
  special = false
}

module "rds" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 5"

  name          = local.name
  database_name = replace(local.name, "-", "_")
  username      = local.db_username
  password      = local.db_password
  create_random_password = false

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

  #  subnets                = module.vpc.database_subnets
  db_subnet_group_name  = module.vpc.database_subnet_group_name

  create_security_group  = false
  vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]


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

module "rds_proxy_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4"

  name        = "${local.name}-rds_proxy-sg"
  description = "PostgreSQL RDS Proxy example security group"
  vpc_id      = module.vpc.vpc_id

  revoke_rules_on_delete = true

  computed_ingress_with_source_security_group_id = [
    {
      rule                     = "postgresql-tcp"
      source_security_group_id = module.lambda_sg.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1

  ## If using rds_proxy
#  egress_with_cidr_blocks = [
#    {
#      description = "Database subnet PostgreSQL access"
#      rule        = "postgresql-tcp"
#      cidr_blocks = join(",", module.vpc.database_subnets_cidr_blocks)
#    },
#  ]

  tags = local.tags
}

#module "rds_proxy" {
#  source = "clowdhaus/rds-proxy/aws"
#
#  create_proxy = true
#
#  name                   = local.name
#  iam_role_name          = local.name
#  vpc_subnet_ids         = module.vpc.private_subnets
#  vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]
#
#  db_proxy_endpoints = {
#    read_write = {
#      name                   = "read-write-endpoint"
#      vpc_subnet_ids         = module.vpc.private_subnets
#      vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]
#      tags                   = local.tags
#    },
#    read_only = {
#      name                   = "read-only-endpoint"
#      vpc_subnet_ids         = module.vpc.private_subnets
#      vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]
#      target_role            = "READ_ONLY"
#      tags                   = local.tags
#    }
#  }
#
#  secrets = {
#    "${aws_secretsmanager_secret.rds.name}" = {
#      description = aws_secretsmanager_secret.rds.description
#      arn         = aws_secretsmanager_secret.rds.arn
#      kms_key_id  = aws_secretsmanager_secret.rds.kms_key_id
#    }
#  }
#
#  engine_family = "POSTGRESQL"
#  db_host       = module.rds.rds_cluster_endpoint
#  db_name       = module.rds.rds_cluster_database_name
#  debug_logging = true
#
#  # Target Aurora cluster
#  target_db_cluster     = true
#  db_cluster_identifier = module.rds.rds_cluster_id
#
#  tags = local.tags
#}
