data "http" "myip" {
  url = "http://ipv4.icanhazip.com"
}

locals {
  name = "gnothi-dev"
  name_ = replace(local.name, "-", "_")
  domain_name = "gnothi.com" # trimsuffix(data.aws_route53_zone.this.name, ".")
  subdomain   = "dev"
  full_domain = "dev.gnothi.com"
  region = "us-east-1"
  main_az = "us-east-1a"
  myip = ["${chomp(data.http.myip.body)}/32"]
  
  tags = {
    app = local.name
    Name = local.name
  }
}

terraform {
  backend "s3" {
    bucket = "lefnire-private"
    key    = "gnothi-dev/terraform.tfstate"
    region = "us-east-1"
    #profile = "terraform"
  }
}

provider "aws" {
  region  = local.region
  #shared_credentials_file = "/home/ec2-user/.aws/credentials"
  #profile                 = "terraform"

  # Make it faster by skipping some things
  skip_get_ec2_platforms      = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_credentials_validation = true

  # skip_requesting_account_id should be disabled to generate valid ARN in apigatewayv2_api_execution_arn
  skip_requesting_account_id = false
}

resource "aws_efs_file_system" "efs" {
  creation_token = "${local.name}-efs"
  encrypted = true
  tags = local.tags
}