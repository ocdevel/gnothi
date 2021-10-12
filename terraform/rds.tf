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
