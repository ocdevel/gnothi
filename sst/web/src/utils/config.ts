export const API_WS = import.meta.env.VITE_API_WS!
export const API_HTTP = import.meta.env.VITE_API_HTTP!

export const OFFLINE = import.meta.env.VITE_OFFLINE
export const DEV = import.meta.env.VITE_STAGE==='dev'
console.log({DEV})
export const AUTHED = false


console.log(API_WS, API_HTTP)
export const awsConfig = OFFLINE ? {} : {
  Auth: {
    // mandatorySignIn: true,
    region: import.meta.env.VITE_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
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
