import * as sst from "@serverless-stack/resources";

export default class MyStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);
    const api = this.addApi()
    const ws = this.addWebsockets()
    const frontend = this.addFrontend(api, ws)
  }

  addApi(): sst.Api {
     // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "GET /": "src/lambda.handler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      "ApiEndpoint": api.url,
    });

    return api
  }

  addWebsockets(): sst.WebSocketApi {
    const ws = new sst.WebSocketApi(this, "WS", {
      routes: {
        $connect: "src/ws.handler",
        $default: "src/ws.handler",
        $disconnect: "src/ws.handler"
      },
    });
    this.addOutputs({
      WSEndpoint: ws.url,
    })
    return ws
  }

  addFrontend(api: sst.Api, ws: sst.WebSocketApi): sst.ReactStaticSite {
      // Deploy our React app
    const site = new sst.ReactStaticSite(this, "ReactSite", {
      path: "frontend",
      environment: {
        // Pass in the API endpoint to our app
        REACT_APP_API_URL: api.url,
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
}

