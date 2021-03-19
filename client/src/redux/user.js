import {action, thunk} from "easy-peasy";
import moment from "moment-timezone";
import _ from "lodash";



export const store = {
  jwt: null,
  setJwt: action((state, jwt) => {
    state.jwt = jwt
  }),

  logout: action((state, payload) => {
    // localStorage.removeItem('access_token')
    // localStorage.removeItem('refresh_token')
    // window.location.href = "/"
  }),

  onAny: thunk((actions, payload, helpers) => {
    const {jwt, as, user} = helpers.getState()
    const {emit} = helpers.getStoreActions().ws

    const [action, res] = payload
    const data = res.data
    // console.log(action, data)
    switch (action) {
      case "user/get":
        // if (as) {
        //   // FIXME fetch basic info from user, limited by permissions
        //   // dispatch(setAsUser(data))
        //   break
        // }
        // if (res.code === 401) {
        //   return actions.logout()
        // }
    }
  })
}
