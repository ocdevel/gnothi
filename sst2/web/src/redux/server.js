import axios from "axios";
import _ from "lodash";
import {thunk, action} from 'easy-peasy'

import {API_URL} from './ws'


export const store = {
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

    try {
      const {status: code, data} = await axios(obj)
      return {code, data}
    } catch (error) {
      let {status: code, statusText: message, data} = error.response
      message = data.detail || message || "There was an error"

      if (data.jwt_error) {
        // try refreshing the token, then try again
        // jwt = await refreshToken(helpers)
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
