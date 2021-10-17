# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest
# https://github.com/terraform-aws-modules/terraform-aws-rds-aurora/blob/master/examples/postgresql/main.tf#L22

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3"

  name = local.name
  cidr = "10.99.0.0/18"

  azs              = ["${local.region}a", "${local.region}b", "${local.region}c"]
  public_subnets   = ["10.99.0.0/24", "10.99.1.0/24", "10.99.2.0/24"]
  private_subnets  = ["10.99.3.0/24", "10.99.4.0/24", "10.99.5.0/24"]
  database_subnets = ["10.99.7.0/24", "10.99.8.0/24", "10.99.9.0/24"]

  create_database_subnet_group = true
  enable_nat_gateway           = true
  single_nat_gateway           = true
#  map_public_ip_on_launch      = false
#
#  manage_default_security_group  = true
#  default_security_group_ingress = []
#  default_security_group_egress  = []
#
# # TODO needed for HIPAA?
#  enable_flow_log                      = true
#  flow_log_destination_type            = "cloud-watch-logs"
#  create_flow_log_cloudwatch_log_group = true
#  create_flow_log_cloudwatch_iam_role  = true
#  flow_log_max_aggregation_interval    = 60
#  flow_log_log_format                  = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"

  tags = local.tags
}
