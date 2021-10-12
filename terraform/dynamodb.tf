module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name     = "${local.name}-ws-connections"
  hash_key = "connection_id"



  attributes = [
    {
      name = "connection_id"
      type = "S"
    }
  ]

  tags = local.tags
}

