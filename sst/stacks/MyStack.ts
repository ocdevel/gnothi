import * as sst from "@serverless-stack/resources";

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
        "GET /": "src/rest/index.handler",
      },
    });
    // Show the endpoint in the output
    this.addOutputs({
      "RESTEndpoint": api.url,
    });
    return api
  }

  addWebsockets(app: sst.App, rds: sst.RDS, DATABASE: string): sst.WebSocketApi {
    const ws = new sst.WebSocketApi(this, "WS", {
      defaultFunctionProps: {
        environment: {
          DATABASE,
          CLUSTER_ARN: rds.clusterArn,
          SECRET_ARN: rds.secretArn,
        },
        permissions: [rds],
      },
      routes: {
        $connect: "src/ws/connect.handler",
        $disconnect: "src/ws/disconnect.handler",
        $default: "src/ws/default.handler",
      },
    });
    this.addOutputs({
      WSEndpoint: ws.url,
    })
    return ws
  }

  addFrontend(app: sst.App, rest: sst.Api, ws: sst.WebSocketApi): sst.ReactStaticSite {
      // Deploy our React app
    const site = new sst.ReactStaticSite(this, "ReactSite", {
      path: "frontend",
      environment: {
        // Pass in the API endpoint to our app
        REACT_APP_REST_URL: rest.url,
        REACT_APP_WS_URL: ws.url,
      },
      // customDomain: "www.my-react-app.com",

    });

    // Show the URLs in the output
    this.addOutputs({
      SiteUrl: site.url
    });

    return site
  }

  addRds(app: sst.App, DATABASE: string): sst.RDS {
    // Create the Aurora DB cluster
    const cluster = new sst.RDS(this, "Cluster", {
      engine: "postgresql10.14",
      defaultDatabaseName: DATABASE,
      migrations: "src/data/migrations"
    });
    this.addOutputs({
      ClusterIdentifier: cluster.clusterIdentifier,
    });
    return cluster
  }
}

