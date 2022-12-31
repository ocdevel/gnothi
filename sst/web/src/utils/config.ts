export const STAGE = import.meta.env.VITE_STAGE

const env = (
  // Using manually-entered values for staging env vars so we can develop localhost
  // against staging backend. Edge-case, won't use for production or other
  STAGE === "staging" ? {
    "VITE_API_WS": "wss://gk25nph8o6.execute-api.us-east-1.amazonaws.com/staging",
    "VITE_API_HTTP": "https://bel3k2njd8.execute-api.us-east-1.amazonaws.com",
    "VITE_REGION": "us-east-1",
    "VITE_USER_POOL_ID": "us-east-1_BJPuyWgb0",
    "VITE_USER_POOL_CLIENT_ID": "282n7agovqicvma9rrti0nojo4"
  }
  // Allow editing static pages without need for a backend
  : STAGE === "offline" ? {
    "VITE_API_WS": "",
    "VITE_API_HTTP": "",
    "VITE_REGION": "",
    "VITE_USER_POOL_ID": "",
    "VITE_USER_POOL_CLIENT_ID": ""

  }
  // The default approach: use env vars injected from vite
  : {
    "VITE_API_WS": import.meta.env.VITE_API_WS!,
    "VITE_API_HTTP": import.meta.env.VITE_API_HTTP!,
    "VITE_REGION": import.meta.env.VITE_REGION,
    "VITE_USER_POOL_ID": import.meta.env.VITE_USER_POOL_ID,
    "VITE_USER_POOL_CLIENT_ID": import.meta.env.VITE_USER_POOL_CLIENT_ID
  }
)
export const API_WS = env.VITE_API_WS
export const API_HTTP = env.VITE_API_HTTP

export const OFFLINE = STAGE === "offline"
export const DEV = STAGE === "DEV"
export const AUTHED = false


console.log(API_WS, API_HTTP)
export const awsConfig = {
  Auth: {
    // mandatorySignIn: true,
    region: env.VITE_REGION,
    userPoolId: env.VITE_USER_POOL_ID,
    userPoolWebClientId: env.VITE_USER_POOL_CLIENT_ID,
  },
  // API: {
  //   endpoints: [
  //     {
  //       name: "api",
  //       endpoint: import.meta.env.VITE_APP_API_URL,
  //       region: import.meta.env.VITE_APP_REGION,
  //     },
  //   ],
  // },
}
