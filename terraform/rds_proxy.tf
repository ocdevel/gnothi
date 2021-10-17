module "lambda_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4"

  name        = "${local.name}-lambda"
  description = "Lambda RDS Proxy example security group"
  vpc_id      = module.vpc.vpc_id

  egress_rules = ["all-all"]

  tags = local.tags
}

module "rds_proxy_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 4"

  name        = "${local.name}-rds_proxy"
  description = "PostgreSQL RDS Proxy example security group"
  vpc_id      = module.vpc.vpc_id

  revoke_rules_on_delete = true

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

module "rds_proxy" {
  source = "clowdhaus/rds-proxy/aws"

  create_proxy = true

  name                   = local.name
  iam_role_name          = local.name
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]

  db_proxy_endpoints = {
    read_write = {
      name                   = "read-write-endpoint"
      vpc_subnet_ids         = module.vpc.private_subnets
      vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]
      tags                   = local.tags
    },
    read_only = {
      name                   = "read-only-endpoint"
      vpc_subnet_ids         = module.vpc.private_subnets
      vpc_security_group_ids = [module.rds_proxy_sg.security_group_id]
      target_role            = "READ_ONLY"
      tags                   = local.tags
    }
  }

  secrets = {
    "${local.name}-rds" = {
      description = aws_secretsmanager_secret.rds.description
      arn         = aws_secretsmanager_secret.rds.arn
      kms_key_id  = aws_secretsmanager_secret.rds.kms_key_id
    }
  }

  engine_family = "POSTGRESQL"
  db_host       = module.rds.rds_cluster_endpoint
  db_name       = module.rds.rds_cluster_database_name
  debug_logging = true

  # Target Aurora cluster
  target_db_cluster     = true
  db_cluster_identifier = module.rds.rds_cluster_id

  tags = local.tags
}
