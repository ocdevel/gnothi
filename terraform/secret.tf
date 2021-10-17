resource "aws_secretsmanager_secret" "rds_secret" {
  name_prefix = "${local.name}-proxy-secret"
  recovery_window_in_days = 7
  description = "Secret for RDS Proxy"
}

resource "aws_secretsmanager_secret_version" "rds_secret_version" {
  secret_id     = aws_secretsmanager_secret.rds_secret.id
  secret_string = jsonencode({
    "username"             = "my_username"
    "password"             = "my_password"
#    "engine"               = "postgres"
#    "host"                 = module.aurora.
#    "port"                 = 3306
#    "dbInstanceIdentifier" = module.aurora.rds_cluster_id
  })
}
