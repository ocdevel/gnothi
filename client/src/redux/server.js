import axios from "axios";
import _ from "lodash";
import {thunk, action} from 'easy-peasy'

// e52c6629: dynamic host/port
let host = window.location.host
if (~host.indexOf('gnothi')) { // prod
  host = 'https://api.gnothiai.com'
} else { // dev
  host = 'http://localhost:5002'
}

export const API_URL = host;

// Every fetch (except jobs-status) will check the user in, so debounce it a bit since
// we're often fetching a ton at once
const checkin = _.debounce((store) => {
  // don't pass in jwt, since it may change due to refresh token. Pass getState instead
  const {jwt} = store.getStoreState().user
  axios({
    method: 'GET',
    url: `${API_URL}/user/checkin`,
    headers: {'Authorization': `Bearer ${jwt}`}
  })
}, 1000)

async function refreshToken(store) {
  const actions = store.getStoreActions()

  try {
    const {data} = await axios({
      method: 'POST',
      url: `${API_URL}/auth/refresh`,
      headers: {'Authorization': `Bearer ${localStorage.getItem('refresh_token')}`}
    })
    actions.user.setJwt(data)
    return data.access_token
  } catch (error) {
    if (error.response.status === 422) {
      // TODO investigate why server sending 422 here
      actions.user.logout()
    }
    return false
  }
}

export const store = {
  ai: "off",
  setAi: action((state, payload) => {
    state.ai = payload
  }),

  error: null,
  setError: action((state, payload) => {
    state.error = payload
  }),

  fetch: thunk(async (actions, payload, helpers) => {
    const {
      route,
      method = 'GET',
      body = null,
      headers = {}
    } = payload

    let {jwt, user, as} = helpers.getStoreState().user

    const obj = {
      method,
      headers: {'Content-Type': 'application/json', ...headers},
    };

    if (body) obj['data'] = body
    if (jwt) obj['headers']['Authorization'] = `Bearer ${jwt}`
    // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
    let url = `${API_URL}/${route}`
    if (as && user && as !== user.id) {
      url += (~route.indexOf('?') ? '&' : '?') + `as_user=${as}`
    }
    obj['url'] = url

    if (route !== 'jobs-status') {
      checkin(helpers)
    }

    try {
      const {status: code, data} = await axios(obj)
      return {code, data}
    } catch (error) {
      let {status: code, statusText: message, data} = error.response
      message = data.detail || message || "There was an error"

      if (data.jwt_error) {
        // try refreshing the token, then try again
        jwt = await refreshToken(helpers)
        if (jwt) {
          obj['headers']['Authorization'] = `Bearer ${jwt}`
          try {
            const {status: code, data} = await axios(obj)
            return {code, data}
          } catch {
            // Couldn't fix via refresh-token. carry on to error-handling below.
          }
        }
      }

      // Show errors, but not for 401 (we simply restrict access to components)
      if (code >= 400 && code !== 401) {
        actions.setError(message)
      }
      return {code, message, data}
    }
  })
}
