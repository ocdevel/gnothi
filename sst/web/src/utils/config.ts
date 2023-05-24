export const STAGE = import.meta.env.VITE_STAGE

const env = (
  // Using manually-entered values for staging env vars so we can develop localhost
  // against staging backend. Edge-case, won't use for production or other


  //  STAGE === "staging" ?  {"VITE_API_WS":"wss://67jndf1ak4.execute-api.us-east-1.amazonaws.com/legion4","VITE_API_HTTP":"https://pmake3nzve.execute-api.us-east-1.amazonaws.com","VITE_REGION":"us-east-1","VITE_USER_POOL_ID":"us-east-1_A7IaNNEo9","VITE_USER_POOL_CLIENT_ID":"4dtc6lv06ick36klca0g7k5u8p"}
   STAGE === "staging" ?  {"VITE_API_WS":"wss://5brd024aqi.execute-api.us-east-1.amazonaws.com/staging","VITE_API_HTTP":"https://ovhaaooqke.execute-api.us-east-1.amazonaws.com","VITE_REGION":"us-east-1","VITE_USER_POOL_ID":"us-east-1_yQ3nbk6Kd","VITE_USER_POOL_CLIENT_ID":"1vb430v97j8ic8d3iic4b1epd8"}



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
