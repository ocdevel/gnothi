terraform {
#  backend "s3" {
#    bucket = "lefnire-private"
#    key    = "gnothi-dev/terraform.tfstate"
#    region = "us-east-1"
#    profile = "terraform"
#  }
}

provider "aws" {
  region  = local.region
#  shared_credentials_file = "/home/lefnire/.aws/credentials"
#  profile                 = "terraform"

  # Make it faster by skipping some things
  skip_get_ec2_platforms      = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_credentials_validation = true

  # skip_requesting_account_id should be disabled to generate valid ARN in apigatewayv2_api_execution_arn
  #skip_requesting_account_id = false


  # https://github.com/localstack/localstack-pro-samples/blob/master/terraform-resources/test.tf
  skip_requesting_account_id = true
  access_key                  = "fake"
  secret_key                  = "fake"
  endpoints {
    acm     = "http://localhost:4566"
    apigateway     = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    cloudwatchlogs     = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    es             = "http://localhost:4566"
    ecs             = "http://localhost:4566"
    ec2             = "http://localhost:4566"
    efs             = "http://localhost:4566"
    iam            = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    kms         = "http://localhost:4566"
    kinesis         = "http://localhost:4566"
    route53        = "http://localhost:4566"
    rds            = "http://localhost:4566"
    s3             = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ses            = "http://localhost:4566"
    sns            = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    stepfunctions  = "http://localhost:4566"
    sts            = "http://localhost:4566"
  }
}

locals {
  name = "gnothi-dev"
  name_ = replace(local.name, "-", "_")
  domain_name = "gnothi.com" # trimsuffix(data.aws_route53_zone.this.name, ".")
  subdomain   = "dev"
  full_domain = "dev.gnothi.com"
  region = "us-east-1"
  tags = {
    app = local.name
    Name = local.name
  }
}
