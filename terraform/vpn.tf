# Follow https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/client-authentication.html#mutual

data "aws_acm_certificate" "server" {
  domain = "server"
}

data "aws_acm_certificate" "client" {
  domain = "client1.domain.tld"
}

#resource "aws_acm_certificate" "vpn_server" {
#  domain_name = "vpn.dev.gnothi.com"
#  validation_method = "DNS"
#
#  tags = local.tags
#
#  lifecycle {
#    create_before_destroy = true
#  }
#}

#resource "aws_acm_certificate_validation" "vpn_server" {
#  certificate_arn = aws_acm_certificate.vpn_server.arn
#
#  timeouts {
#    create = "1m"
#  }
#}

#resource "aws_acm_certificate" "vpn_client_root" {
#  private_key = file("certs/client-vpn-ca.key")
#  certificate_body = file("certs/client-vpn-ca.crt")
#  certificate_chain = file("certs/ca-chain.crt")
#
#  tags = local.tags
#}

resource "aws_security_group" "vpn_access" {
  vpc_id = module.vpc.vpc_id
  name = "${local.name}-vpn-sg"

  ingress {
    from_port = 443
    protocol = "UDP"
    to_port = 443
    cidr_blocks = ["0.0.0.0/0"]
    description = "Incoming VPN connection"
  }

  egress {
    from_port = 0
    protocol = "-1"
    to_port = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_ec2_client_vpn_endpoint" "vpn" {
  description = "${local.name} Client VPN"
  client_cidr_block = "20.10.31.0/16"
  split_tunnel = true
  server_certificate_arn = data.aws_acm_certificate.server.arn

  authentication_options {
    type = "certificate-authentication"
    root_certificate_chain_arn = data.aws_acm_certificate.client.arn
  }

  connection_log_options {
    enabled = false
  }

  tags = local.tags
}

resource "aws_ec2_client_vpn_network_association" "vpn_subnets" {
  count = length(module.vpc.private_subnets)

  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.vpn.id
  subnet_id = module.vpc.private_subnets[count.index]
  security_groups = [aws_security_group.vpn_access.id]

  lifecycle {
    // The issue why we are ignoring changes is that on every change
    // terraform screws up most of the vpn assosciations
    // see: https://github.com/hashicorp/terraform-provider-aws/issues/14717
    ignore_changes = [subnet_id]
  }
}

resource "aws_ec2_client_vpn_authorization_rule" "vpn_auth_rule" {
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.vpn.id
  target_network_cidr = module.vpc.vpc_cidr_block
  authorize_all_groups = true
}
