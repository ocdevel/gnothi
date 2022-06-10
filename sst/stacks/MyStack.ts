import {
  StackContext,
  Api,
  RDS,
  RDSProps,
  WebSocketApi,
  ReactStaticSite
} from "@serverless-stack/resources";
// import * as sst from "@serverless-stack/resources";
import { envKeys } from '../backend/functions/util/env'


export function Gnothi(context: StackContext) {
  const {app, stack} = context
  const {name, stage} = app // stack ?
  const DATABASE = `${name}${stage}`
  const rds = addRds(context, DATABASE)
  const rest = addRest(context, rds, DATABASE)
  const ws = addWebsockets(context, rds, DATABASE)
  const frontend = addFrontend(context, rest, ws)
}

function addRest({app, stack}: StackContext, rds: RDS, DATABASE: string): Api {
   // Create a HTTP API
  const api = new Api(stack, "REST", {
    routes: {
      // "GET /": "src/routes/index.handler",
      "$default": "functions/routes/index.handler",
    },
  });
  // Show the endpoint in the output
  stack.addOutputs({
    [envKeys.endpoints.rest]: api.url,
  });
  return api
}

function addWebsockets({app, stack}: StackContext, rds: RDS, DATABASE: string): WebSocketApi {
  const ws = new WebSocketApi(stack, "WS", {
    defaults: {
      function: {
        environment: {
          [envKeys.db.database]: DATABASE,
          [envKeys.db.cluster]: rds.clusterArn,
          [envKeys.db.secret]: rds.secretArn,
        },
        permissions: [rds],
      }
    },
    routes: {
      $default: "functions/routes/index.handler",
    },
  });
  stack.addOutputs({
    [envKeys.endpoints.ws]: ws.url,
  })
  return ws
}

function addFrontend({app, stack}: StackContext, rest: Api, ws: WebSocketApi): ReactStaticSite {
    // Deploy our React app
  const site = new ReactStaticSite(stack, "ReactSite", {
    path: "frontend",
    environment: {
      // Pass in the API endpoint to our app
      ['REACT_APP_' + envKeys.endpoints.rest]: rest.url,
      ['REACT_APP_' + envKeys.endpoints.ws]: ws.url,
    },
    // customDomain: "www.my-react-app.com",

  });

  // Show the URLs in the output
  stack.addOutputs({
    [envKeys.endpoints.web]: site.url
  });

  return site
}

function addRds({app, stack}: StackContext, DATABASE: string): RDS {
  const prodConfig: RDSProps['scaling'] = {
    autoPause: false,
    minCapacity: "ACU_8",
    maxCapacity: "ACU_64",
  };
  const devConfig: RDSProps['scaling'] = {
    autoPause: true, // use this during active development/testing
    // autoPause: true, // use this otherwise (save money)
    minCapacity: "ACU_2",
    maxCapacity: "ACU_8",
  };


  // Create the Aurora DB cluster
  const cluster = new RDS(stack, "Cluster", {
    engine: "postgresql10.14",
    defaultDatabaseName: DATABASE,
    migrations: "backend/functions/data/migrations",
    scaling: app.stage === "prod" ? prodConfig : devConfig,
  });
  stack.addOutputs({
    [envKeys.db.database]: DATABASE,
    [envKeys.db.cluster]: cluster.clusterArn,
    [envKeys.db.secret]: cluster.secretArn,
  });
  return cluster
}
