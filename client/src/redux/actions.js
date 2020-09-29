import axios from 'axios'
import moment from "moment-timezone"
import _ from "lodash";
import {trueKeys} from "../utils";

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

// Every fetch (except jobs-status) will check the user in, so debounce it a bit since
// we're often fetching a ton at once
const checkin = _.debounce((headers) => {
  axios({
    method: 'GET',
    url: `${host}/user/checkin`,
    headers
  })
}, 1000)

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

  if (route !== 'jobs-status') { checkin(obj.headers) }

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
}

export const SET_AS = "SET_AS"
export const setAs = (payload) => ({type: SET_AS, payload})
export const changeAs = (as=null) => async (dispatch, getState) => {
  dispatch(setAs(as))
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
export const getTags = () => async (dispatch, getState) => {
  if (!getState().jwt) {return}
  const {data} = await dispatch(fetch_('tags', 'GET'))
  dispatch(setTags(data))
}

export const SET_INFLUENCERS = "SET_INFLUENCERS"
export const setInfluencers = (payload) => ({type: SET_INFLUENCERS, payload})

export const SET_FIELDS = "SET_FIELDS"
export const setFields = (payload) => ({type: SET_FIELDS, payload})
export const getFields = () => async (dispatch, getState) => {
  if (!getState().jwt) {return}
  let {data, code, message} = await dispatch(fetch_('fields', 'GET'))
  data = code === 401 ? {code, message} : data
  dispatch(setFields(data))

  if (code == 200) {
    let {data} = await dispatch(fetch_('influencers', 'GET'))
    dispatch(setInfluencers(data))
  }
}

export const SET_ENTRIES = "SET_ENTRIES"
export const setEntries = (payload) => ({type: SET_ENTRIES, payload})
export const getEntries = () => async (dispatch, getState) => {
  if (!getState().jwt) {return}
  let {data, code, message} =  await dispatch(fetch_('entries', 'GET'))
  data = code === 401 ? {code, message} : data
  dispatch(setEntries(data))
}

export const SET_INSIGHTS = "SET_INSIGHTS"
export const setInsights = (payload) => ({type: SET_INSIGHTS, payload})

export const getInsights = (k) => async (dispatch, getState) => {
  const fetch_k = `${k}_fetching`
  const res1_k = `${k}_res1`
  const res2_k = `${k}_res2`
  dispatch(setInsights({
    [fetch_k]: true,
    [res1_k]: {}
  }))

  const {insights, selectedTags} = getState()
  const body = { days: insights.days }
  const tags = trueKeys(selectedTags)
  if (tags.length) { body.tags = tags }

  let res;
  switch (k) {
    case 'ask':
      body.question = insights.ask_req
      res = await dispatch(fetch_('ask', 'POST', body))
      break
    case 'themes':
      body.algo = insights.themes_req
      res = await dispatch(fetch_('themes', 'POST', body))
      break
    case 'summarize':
      body.words = insights.summarize_req
      res = await dispatch(fetch_('summarize', 'POST', body))
      break
  }
  dispatch(setInsights({[res1_k]: res}))
  const {jid} = res.data
  if (!jid) {
    return dispatch(setInsights({[fetch_k]: false}))
  }
  res = await dispatch(fetch_(`await-job/${jid}`))
  dispatch(setInsights({[res2_k]: res, [fetch_k]: false}))
}
