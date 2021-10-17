data "aws_iam_policy_document" "assume_role" {

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "rds_proxy_policy_document" {

  statement {
    sid = "AllowProxyToGetDbCredsFromSecretsManager"

    actions = [
      "secretsmanager:GetSecretValue"
    ]

    resources = [
      aws_secretsmanager_secret.rds_secret.arn
    ]
  }

  statement {
    sid = "AllowProxyToDecryptDbCredsFromSecretsManager"

    actions = [
      "kms:Decrypt"
    ]

    resources = [
      "*"
    ]

    condition {
      test     = "StringEquals"
      values   = ["secretsmanager.${local.region}.amazonaws.com"]
      variable = "kms:ViaService"
    }
  }
}

resource "aws_iam_policy" "rds_proxy_iam_policy" {
  name   = "${local.name}-rds-proxy-policy"
  policy = data.aws_iam_policy_document.rds_proxy_policy_document.json
}

resource "aws_iam_role_policy_attachment" "rds_proxy_iam_attach" {
  policy_arn = aws_iam_policy.rds_proxy_iam_policy.arn
  role       = aws_iam_role.rds_proxy_iam_role.name
}

resource "aws_iam_role" "rds_proxy_iam_role" {
  name               = "${local.name}-rds-proxy-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}
