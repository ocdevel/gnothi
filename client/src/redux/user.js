import {action, thunk} from "easy-peasy";
import moment from "moment-timezone";
import _ from "lodash";

export const timezones = moment.tz.names().map(n => ({value: n, label: n}))

export const store = {
  user: null,
  setUser: action((state, payload) => {
    state.user = payload
  }),

  as: null,
  asUser: null,
  setAs: action((state, payload) => {
    state.as = payload
    state.asUser = !payload ? null
        : _.find(state.shares, {id: payload})
  }),

  shares: [],
  setShares: action((state, payload) => {
    state.shares = payload
  }),
  getShares: thunk(async (actions, payload, helpers) => {
    const {jwt} = helpers.getState()
    const {emit} = helpers.getStoreActions().ws

    if (!jwt) {return}
    const {data, code} = await emit(["users/shares.get", {}])
    actions.setShares(data)
  }),

  logout: action((state, payload) => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = "/"
  }),

  getUser: thunk(async (actions, payload, helpers) => {
    const {jwt, as, user} = helpers.getState()
    const {fetch} = helpers.getStoreActions().server
    const {emit} = helpers.getStoreActions().ws

    if (!jwt) {return}
    const {data, code} = await emit(["users/user.get", {}])
    if (as) {
      // FIXME fetch basic info from user, limited by permissions
      // dispatch(setAsUser(data))
      return
    }
    if (code === 401) {
      return actions.logout()
    }
    actions.getShares()
    actions.setUser(data)
    if (!data.timezone) {
       // Guess their default timezone (TODO should call this out?)
      const timezone = moment.tz.guess(true)
      emit(["users/profile.put", {timezone}])
    }
  }),

  jwt: localStorage.getItem('access_token'),
  setJwt: action((state, {access_token, refresh_token}) => {
    localStorage.setItem('access_token', access_token)
    if (refresh_token) {localStorage.setItem('refresh_token', refresh_token)}
    state.jwt = access_token
  }),

  changeAs: thunk(async (actions, payload, helpers) => {
    actions.setAs(payload)
    helpers.getStoreActions().insights.clearInsights('all')
  }),

  profile: {
    first_name: '',
    last_name: '',
    gender: null,
    orientation: null,
    birthday: '',
    timezone: null,
    bio: '',
    therapist: false
  },
  setProfile: action((state, payload) => {
    state.profile = payload
  }),

  onAny: thunk((actions, payload, helpers) => {
    const {emit} = helpers.getStoreState().ws
    let [event, data] = payload
    data = data[0]
    if (event === 'profile') {
      data.timezone = _.find(timezones, t => t.value === data.timezone)
      actions.setProfile(data)
    }
  })
}
