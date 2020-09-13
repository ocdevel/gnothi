import axios from 'axios'
import moment from "moment-timezone"
import _ from "lodash";

// e52c6629: dynamic host/port
let host = window.location.host
if (~host.indexOf('gnothi')) { // prod
  host = 'https://api.gnothiai.com'
} else { // dev
  host = 'http://localhost:5002'
}

export const SET_SERVER_ERROR = "SET_SERVER_ERROR"
export function setServerError(payload) {
  return {
    type: SET_SERVER_ERROR,
    payload
  }
}

export const FETCH = "FETCH"
export const fetch_ = (
  route,
  method='GET',
  body=null,
  headers={}
) => async (dispatch, getState) => {
  const {jwt, user, as} = getState()
  const obj = {
    method,
    headers: {'Content-Type': 'application/json', ...headers},
  };

  if (body) obj['data'] = body
  if (jwt) obj['headers']['Authorization'] = `Bearer ${jwt}`
  // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
  let url = `${host}/${route}`
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
    // Show errors, but not for 401 (we simply restrict access to components)
    if (code >= 400 && code !== 401) {
      dispatch(setServerError(message))
    }
    return {code, message, data}
  }
}

export const SET_USER = "SET_USER"
export const SET_AS_USER = "SET_AS_USER"
export const setUser = (payload) => ({type: SET_USER, payload})
export const setAsUser = (payload) => ({type: SET_AS_USER, payload})

export const logout = () => {
  localStorage.removeItem('jwt')
  window.location.href = "/"
}

export const getUser = () => async (dispatch, getState) => {
  const {jwt, as, user} = getState()
  if (!jwt) {return}
  const {data, code} = await dispatch(fetch_('user', 'GET'))
  if (as) {
    // FIXME fetch basic info from user, limited by permissions
    // dispatch(setAsUser(data))
    return
  }
  if (code === 401) {
    return dispatch(logout())
  }
  dispatch(setUser(data))
  dispatch(fetch_('user/checkin', 'POST'))
  if (!data.timezone) {
     // Guess their default timezone (TODO should call this out?)
    const timezone = moment.tz.guess(true)
    dispatch(fetch_('profile/timezone', 'PUT', {timezone}))
  }
}

export const SET_JWT = "SET_JWT"
export const setJwt = (payload) => {
  localStorage.setItem('jwt', payload)
  return {type: SET_JWT, payload}
}
export const onAuth = (jwt) => async (dispatch, getState) => {
  dispatch(setJwt(jwt))
  dispatch(getUser())
}

export const SET_AS = "SET_AS"
export const setAs = (payload) => ({type: SET_AS, payload})
export const changeAs = (as=null) => async (dispatch, getState) => {
  dispatch(setAs(as))
  dispatch(getUser())
}

export const SET_AI_STATUS = "SET_AI_STATUS"
export const setAiStatus = (payload) => ({type: SET_AI_STATUS, payload})
export const checkAiStatus = () => async (dispatch, getState) => {
  if (!getState().jwt) {return}
  const {data} = await dispatch(fetch_('jobs-status'))
  dispatch(setAiStatus(data))
}

export const SET_TAGS = "SET_TAGS"
export const setTags = (payload) => ({type: SET_TAGS, payload})
export const SET_SELECTED_TAGS = "SET_SELECTED_TAGS"
export const setSelectedTags = (payload) => ({type: SET_SELECTED_TAGS, payload})
export const getTags = (preSelectMain=true) => async (dispatch, getState) => {
  if (!getState().jwt) {return}
  const {data} = await dispatch(fetch_('tags', 'GET'))
  console.log(data)
  dispatch(setTags(data))
}
