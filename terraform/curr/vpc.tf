# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/master/examples/postgresql/main.tf#L22

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = local.name
  cidr = "10.99.0.0/18"

  azs              = ["${local.region}a", "${local.region}b", "${local.region}c"]
  public_subnets   = ["10.99.0.0/24", "10.99.1.0/24", "10.99.2.0/24"]
  private_subnets  = ["10.99.3.0/24", "10.99.4.0/24", "10.99.5.0/24"]
  database_subnets = ["10.99.7.0/24", "10.99.8.0/24", "10.99.9.0/24"]
  # create_database_subnet_group = false

  # TODO enable these when working with lambda
  # enable_nat_gateway           = true
  # single_nat_gateway           = true

  # These 3 required for dns-resolution of EFS mount URL. https://bit.ly/33v239F , https://github.com/aws/efs-utils/issues/21
  enable_dns_hostnames = true
  enable_dns_support   = true
  # At least this definitely is, but the above 2 seemed required too? (Don't move a muscle!)
  enable_dhcp_options = true

# # TODO needed for HIPAA?
#  map_public_ip_on_launch      = false
#  enable_flow_log                      = true
#  flow_log_destination_type            = "cloud-watch-logs"
#  create_flow_log_cloudwatch_log_group = true
#  create_flow_log_cloudwatch_iam_role  = true
#  flow_log_max_aggregation_interval    = 60
#  flow_log_log_format                  = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"

  tags = local.tags
}