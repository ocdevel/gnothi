
resource "aws_security_group" "ec2" {
  name        = "${local.name}-ec2"
  description = "${local.name} dev - ssh"
  vpc_id      = module.vpc.vpc_id
  tags = local.tags

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = local.myip
  }
  ingress {
    description = "Web from VPC"
    from_port   = 8888
    to_port     = 8888
    protocol    = "tcp"
    cidr_blocks = local.myip
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "efs" {
  name        = "${local.name}-efs"
  description = "${local.name} dev - efs"
  vpc_id      = module.vpc.vpc_id
  tags = local.tags

  ingress {
    description = "EFS mount target"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_efs_file_system" "efs" {
  creation_token = "${local.name}-efs"
  encrypted = true
  tags = local.tags
}

resource "aws_efs_mount_target" "efs" {
  file_system_id = aws_efs_file_system.efs.id
  subnet_id      = element(module.vpc.private_subnets, 0)  
  security_groups = [aws_security_group.efs.id]
}

locals {
  mnt = "/home/ec2-user/efs"
  # As local so I can print the commands as output, to debug via SSH.
  # Using Amazon Linux 2 AMI (yum) since it was easier to get working with amazon-efs-utils / nfs-utils than Ubuntu
  user_data = <<EOF
#!/bin/bash
yum update -y

# mount efs
yum install amazon-efs-utils -y
mkdir -p ${local.mnt}
mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport ${aws_efs_file_system.efs.dns_name}:/ ${local.mnt}
echo ${aws_efs_file_system.efs.dns_name}:/ ${local.mnt} nfs4 defaults,_netdev 0 0  | cat >> /etc/fstab
chmod go+rw ${local.mnt}

# install docker, data-dir at ~/efs/docker
#rm -rf ${local.mnt}/docker/*
amazon-linux-extras install docker
yum install docker -y
echo "{\"data-root\":\"${local.mnt}/docker\"}" > /etc/docker/daemon.json
usermod -a -G docker ec2-user
pip3 install docker-compose

# update & restart
yum install emacs -y
yum upgrade -y && reboot now
EOF
}

# EFS setup: https://github.com/Apeksh742/EFS_with_terraform/blob/master/main.tf
module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "~> 3.0"

  name = local.name

  ami                    = "ami-0ed9277fb7eb570c9"
  instance_type          = "t2.large"
  key_name = "aws-general"
  availability_zone           = local.main_az
  subnet_id                   = element(module.vpc.public_subnets, 0)
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true

  tags = local.tags

  user_data = local.user_data
}

resource "aws_eip" "eip" {
  instance = module.ec2_instance.id
  vpc      = true
}

output "ec2_ip" {
  value = "ssh -i ~/.ssh/aws-general.pem ec2-user@${aws_eip.eip.public_ip}"
}

output "efs_dns" {
  value = local.user_data
}