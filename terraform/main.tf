terraform {
  backend "s3" {
    bucket = "lefnire-private"
    key    = "gnothi/terraform.tfstate"
    region = "us-east-1"
    profile = "terraform"
  }
}

provider "aws" {
  region  = local.region
  shared_credentials_file = "/home/lefnire/.aws/credentials"
  profile                 = "terraform"

  # Make it faster by skipping some things
  skip_get_ec2_platforms      = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_credentials_validation = true

  # skip_requesting_account_id should be disabled to generate valid ARN in apigatewayv2_api_execution_arn
  skip_requesting_account_id = false
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
