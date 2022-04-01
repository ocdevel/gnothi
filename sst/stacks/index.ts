import MyStack from "./MyStack";
import * as sst from "@serverless-stack/resources";
import * as cdk from "aws-cdk-lib";

export default function main(app: sst.App): void {
  cdk.Tags.of(app).add("Name", `${app.name}-${app.stage}`);

  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: "nodejs14.x"
  });

  new MyStack(app, "my-stack");

  // Add more stacks
}
