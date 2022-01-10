locals {
  batch_name = "${local.name}-batch"
}

resource "aws_iam_role" "ecs_instance_role" {
  name = "${local.batch_name}-ecs-instance"
  tags = local.tags

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
    {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        }
    }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_role" {
  name = "${local.batch_name}-ecs-instance"
  role = aws_iam_role.ecs_instance_role.name
  tags = local.tags
}

resource "aws_iam_role" "aws_batch_service_role" {
  name = "${local.batch_name}-service"
  tags = local.tags

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
    {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
        "Service": "batch.amazonaws.com"
        }
    }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "aws_batch_service_role" {
  role       = aws_iam_role.aws_batch_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

resource "aws_security_group" "batch_ce" {
  name        = "${local.batch_name}-ce"
  description = "${local.batch_name} compute environment"
  tags = local.tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_batch_compute_environment" "ce" {
  compute_environment_name = "${local.batch_name}-ce"

  compute_resources {
    instance_role = aws_iam_instance_profile.ecs_instance_role.arn

    instance_type = [
      #"c4.large",
      "g4dn",
      "g4ad",
    ]

    max_vcpus = 256
    min_vcpus = 0

    security_group_ids = [
      aws_security_group.batch_ce.id,
    ]

    subnets = module.vpc.private_subnets

    type = "EC2"
  }

  service_role = aws_iam_role.aws_batch_service_role.arn
  type         = "MANAGED"
  depends_on   = [aws_iam_role_policy_attachment.aws_batch_service_role]
  tags = local.tags
}

resource "aws_batch_job_queue" "jq" {
  name     = "${local.batch_name}-jq"
  state    = "ENABLED"
  priority = 1
  compute_environments = [
    aws_batch_compute_environment.ce.arn,
  ]
  tags = local.tags
}

resource "aws_batch_job_definition" "jd" {
  name = "${local.batch_name}-jd"
  type = "container"
  tags = local.tags

  container_properties = <<CONTAINER_PROPERTIES
{
    "command": ["nvidia-smi"],
    "image": "nvidia/cuda:10.2-cudnn7-devel",
    "memory": 4096,
    "vcpus": 4,
    "resourceRequirements": [ 
        { 
          "type": "GPU",
          "value": "1"
        }
    ],
    "volumes": [
      {
        "host": {
          "sourcePath": "/tmp"
        },
        "name": "tmp"
      }
    ],
    "environment": [
        {"name": "VARNAME", "value": "VARVAL"}
    ],
    "mountPoints": [
        {
          "sourceVolume": "tmp",
          "containerPath": "/tmp",
          "readOnly": false
        }
    ],
    "ulimits": [
      {
        "hardLimit": 1024,
        "name": "nofile",
        "softLimit": 1024
      }
    ]
}
CONTAINER_PROPERTIES
}