import {Auth} from "aws-amplify";
import _ from "lodash";
import {AUTHED, OFFLINE} from '../../utils/config'

async function getJwtReal(): Promise<string | undefined> {
  const sess = await Auth.currentSession()
  return _.get(sess, "accessToken.jwtToken")
}

async function getJwtFake(): Promise<string | undefined> {
  return AUTHED ? "fake" : undefined
}

export const getJwt = OFFLINE ? getJwtFake : getJwtReal

export async function signOut() {
  return Auth.signOut()
  window.location.href = "/"
}
