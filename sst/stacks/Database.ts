import {RDS, RDSProps, StackContext} from "@serverless-stack/resources";

// TODO Aurora v2 via https://github.com/aws/aws-cdk/issues/20197#issuecomment-1360639346
// need to re-work most things
// Also see https://www.codewithyou.com/blog/aurora-serverless-v2-with-aws-cdk

export function Database({ app, stack }: StackContext): RDS {
  const {stage} = app
  const stage_ = stage === "prod" ? "prod" : "dev"
  const scaling: RDSProps['scaling'] = {
    prod: {
      autoPause: false,
      minCapacity: "ACU_2",
      maxCapacity: "ACU_8",
    } as const,
    dev: {
      autoPause: true, // use this during active development/testing
      minCapacity: "ACU_2",
      maxCapacity: "ACU_8",
    } as const
  }[stage_]

  return new RDS(stack, "testdb", {
    scaling,
    engine: "postgresql11.13",
    defaultDatabaseName: `gnothi${stage_}`,
    migrations: "services/data/migrations"
  })
}
