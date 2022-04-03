import * as sst from "@serverless-stack/resources";
import { envKeys } from '../src/util/env'

export default class MyStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);
    const DATABASE = `${scope.name}${scope.stage}`
    const rds = this.addRds(scope, DATABASE)
    const rest = this.addRest(scope, rds, DATABASE)
    const ws = this.addWebsockets(scope, rds, DATABASE)
    const frontend = this.addFrontend(scope, rest, ws)
  }

  addRest(app: sst.App, rds: sst.RDS, DATABASE: string): sst.Api {
     // Create a HTTP API
    const api = new sst.Api(this, "REST", {
      routes: {
        // "GET /": "src/routes/index.handler",
        "$default": "src/routes/index.handler",
      },
    });
    // Show the endpoint in the output
    this.addOutputs({
      [envKeys.endpoints.rest]: api.url,
    });
    return api
  }

  addWebsockets(app: sst.App, rds: sst.RDS, DATABASE: string): sst.WebSocketApi {
    const ws = new sst.WebSocketApi(this, "WS", {
      defaultFunctionProps: {
        environment: {
          [envKeys.db.database]: DATABASE,
          [envKeys.db.cluster]: rds.clusterArn,
          [envKeys.db.secret]: rds.secretArn,
        },
        permissions: [rds],
      },
      routes: {
        $default: "src/routes/index.handler",
      },
    });
    this.addOutputs({
      [envKeys.endpoints.ws]: ws.url,
    })
    return ws
  }

  addFrontend(app: sst.App, rest: sst.Api, ws: sst.WebSocketApi): sst.ReactStaticSite {
      // Deploy our React app
    const site = new sst.ReactStaticSite(this, "ReactSite", {
      path: "frontend",
      environment: {
        // Pass in the API endpoint to our app
        ['REACT_APP_' + envKeys.endpoints.rest]: rest.url,
        ['REACT_APP_' + envKeys.endpoints.ws]: ws.url,
      },
      // customDomain: "www.my-react-app.com",

    });

    // Show the URLs in the output
    this.addOutputs({
      [envKeys.endpoints.web]: site.url
    });

    return site
  }

  addRds(app: sst.App, DATABASE: string): sst.RDS {
    const prodConfig: sst.RDSScalingProps = {
      autoPause: false,
      minCapacity: "ACU_8",
      maxCapacity: "ACU_64",
    };
    const devConfig: sst.RDSScalingProps = {
      autoPause: false,
      minCapacity: "ACU_2",
      maxCapacity: "ACU_8",
    };


    // Create the Aurora DB cluster
    const cluster = new sst.RDS(this, "Cluster", {
      engine: "postgresql10.14",
      defaultDatabaseName: DATABASE,
      migrations: "src/data/migrations",
      scaling: app.stage === "prod" ? prodConfig : devConfig,
    });
    this.addOutputs({
      [envKeys.db.database]: DATABASE,
      [envKeys.db.cluster]: cluster.clusterArn,
      [envKeys.db.secret]: cluster.secretArn,
    });
    return cluster
  }
}

