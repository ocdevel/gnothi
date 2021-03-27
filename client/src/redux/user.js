import {action, thunk} from "easy-peasy";
import moment from "moment-timezone";
import _ from "lodash";
import {Auth} from "aws-amplify";


export async function getJwt() {
  return new Promise((resolve, reject) => {
    Auth.currentSession().then(res => {
      resolve(_.get(res, "accessToken.jwtToken"))
    })
  })
}


export const store = {
  jwt: null,
  setJwt: action((state, jwt) => {
    state.jwt = jwt
  }),
  checkJwt: thunk(async (actions, payload, helpers) => {
    const jwt = await getJwt()
    actions.setJwt(jwt)
  }),

  as: null,
  asUser: null,
  setAs: action((state, id) => {
    state.as = id
    const shares = state.data['users/shares/get']
    state.asUser = id && _.find(shares, {id})
  }),
  changeAs: thunk(async (actions, payload, helpers) => {
    const {emit} = helpers.getStoreActions().ws
    actions.setAs(payload)
    helpers.getStoreActions().insights.clearInsights('all')
    actions.emit(['users/user/everything', {}])
  }),

  logout: action((state, payload) => {
    Auth.signOut()
    window.location.href = "/"
  }),

  // {create: bool, list: bool, group: str, ..}
  sharePage: {list: true},
  setSharePage: action((s, p) => {s.sharePage = p})
}
