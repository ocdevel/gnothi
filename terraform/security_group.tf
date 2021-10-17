resource "aws_security_group" "sg_lambda" {
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "sg_rds_proxy" {
  vpc_id      = module.vpc.vpc_id

  ingress {
    description      = "Postgres TLS from sg_lambda"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    security_groups  = [aws_security_group.sg_lambda.id]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

 resource "aws_security_group" "sg_rds" {
  vpc_id      = module.vpc.vpc_id

  ingress {
    description      = "Postgres TLS from sg_rds_proxy"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    security_groups  = [aws_security_group.sg_rds_proxy.id]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}
