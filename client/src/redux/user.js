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
  setAs: action((s, p) => {s.as = p}),
  asUser: null,
  setAsUser: action((s, p) => {s.asUser = p}),

  changeAs: thunk(async (actions, id, helpers) => {
    const {emit} = helpers.getStoreActions().ws
    const {data} = helpers.getStoreState().ws
    helpers.getStoreActions().insights.clearInsights('all')

    actions.setAs(id)
    if (id) {
      const found = _.find(
        data['shares/ingress/get'],
        s => s?.user?.id === id
      )
      actions.setAsUser(found)
    } else {
      actions.setAsUser(null)
    }

    emit(['users/user/everything', {}])
  }),

  logout: action((state, payload) => {
    Auth.signOut()
    window.location.href = "/"
  }),

  // {create: bool, list: bool, group: str, ..}
  sharePage: null,
  setSharePage: action((s, p) => {s.sharePage = p})
}
