#data "aws_kms_alias" "secretsmanager" {
#  name = "alias/aws/secretsmanager"
#}

resource "aws_secretsmanager_secret" "rds" {
  name        = "${local.name}-${local.db_username}-rds"
  description = "Database superuser, ${local.db_username}, databse connection values"
#  kms_key_id  = data.aws_kms_alias.secretsmanager.id

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "rds" {
  secret_id = aws_secretsmanager_secret.rds.id
  secret_string = jsonencode({
    username = local.db_username
    password = local.db_password
  })
}
