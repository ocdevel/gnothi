# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/master/examples/postgresql/main.tf#L22

data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = local.name
  cidr = "10.99.0.0/18"

  azs              = ["${local.region}a", "${local.region}b", "${local.region}c"]
  public_subnets   = ["10.99.0.0/24", "10.99.1.0/24", "10.99.2.0/24"]
  private_subnets  = ["10.99.3.0/24", "10.99.4.0/24", "10.99.5.0/24"]
  database_subnets = ["10.99.7.0/24", "10.99.8.0/24", "10.99.9.0/24"]

  enable_nat_gateway = false
  single_nat_gateway = true

  tags = local.tags
}
