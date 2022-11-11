import {RDS, RDSProps, StackContext} from "@serverless-stack/resources";

export function Database({ app, stack }: StackContext): RDS {
  const {stage} = app
  const stage_ = stage === "prod" ? "prod" : "dev"
  const scaling: RDSProps['scaling'] = {
    prod: {
      autoPause: false,
      minCapacity: "ACU_8",
      maxCapacity: "ACU_64",
    } as const,
    dev: {
      autoPause: true, // use this during active development/testing
      minCapacity: "ACU_2",
      maxCapacity: "ACU_8",
    } as const
  }[stage_]

  return new RDS(stack, "db", {
    scaling,
    engine: "postgresql11.13",
    defaultDatabaseName: `gnothi${stage_}`,
    migrations: "services/data/migrations"
  })
}
