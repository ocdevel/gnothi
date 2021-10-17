# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/master/examples/postgresql/main.tf#L22

data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = local.name
  cidr = "10.10.0.0/16"

  azs              = ["${local.region}a", "${local.region}b", "${local.region}c"]
  public_subnets   = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
#  intra_subnets  = ["10.10.101.0/24", "10.10.102.0/24", "10.10.103.0/24"]
  private_subnets  = ["10.10.101.0/24", "10.10.102.0/24", "10.10.103.0/24"]
  database_subnets = ["10.10.201.0/24", "10.10.202.0/24", "10.10.203.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.tags
}
