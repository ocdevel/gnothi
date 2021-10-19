#module "s3_private" {
#  source = "terraform-aws-modules/s3-bucket/aws"
#
#  bucket = "${local.name}-private"
#  acl    = "private"
#
#  versioning = {
#    enabled = false
#  }
#
#  force_destroy = true
#}
