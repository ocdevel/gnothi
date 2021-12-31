module "s3_sagemaker" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${local.name}-sagemaker"
  acl    = "private"

  versioning = {
    enabled = false
  }

  force_destroy = true

  tags = local.tags
}

module "iam_policy_sagemaker" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "~> 4.3"

  name        = "${local.name}-sagemaker"
  #path        = "/"
  description = "${local.name} SageMaker policy"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:ListBucket"
            ],
            "Effect": "Allow",
            "Resource": [
                "${module.s3_sagemaker.s3_bucket_arn}"
            ]
        },
        {
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Effect": "Allow",
            "Resource": [
                "${module.s3_sagemaker.s3_bucket_arn}/*"
            ]
        }
    ]
}
EOF
}

module "iam_role_sagemaker" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "~> 4.3"

  role_name = "${local.name}-sagemaker"
  trusted_role_services = [
    "sagemaker.amazonaws.com"
  ]

  custom_role_policy_arns = [
      "arn:aws:iam::aws:policy/AmazonRDSDataFullAccess",
      "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess",
      module.iam_policy_sagemaker.arn
  ]
  create_role = true
  role_requires_mfa = false

  tags = local.tags
}