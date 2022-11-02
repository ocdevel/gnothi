export const API_WS = import.meta.env.VITE_API_WS!
export const API_HTTP = import.meta.env.VITE_API_HTTP!

export const awsExports = {
  Auth: {
    mandatorySignIn: true,
    region: "us-east-1",
    userPoolId: "us-east-1_Tsww98VBH",
    userPoolWebClientId: "5rh3bkhtmcskqer9t17gg5fn65"
  },
}

export const OFFLINE = true
export const AUTHED = true
