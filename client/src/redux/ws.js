import {useStoreState, useStoreActions, action, thunk} from 'easy-peasy'
import { useState, useEffect } from 'react';
import _ from 'lodash'
import EventEmitter from 'eventemitter3'
import moment from "moment-timezone";
import {Auth} from 'aws-amplify'
import {getJwt} from './user'
export const timezones = moment.tz.names().map(n => ({value: n, label: n}))

// e52c6629: dynamic host/port
let api_url = window.location.host
if (~api_url.indexOf('gnothi')) { // prod
  api_url = 'https://api.gnothiai.com'
} else { // dev
  api_url = 'http://localhost:5002'
}
export const API_URL = api_url

const WS_URL = API_URL.replace(/^https/, 'wss')
  .replace(/^http/, 'ws')
let ws;

export const EE = new EventEmitter()


// Not strictly necessary, but saves time needing to do state.data[k] || x in components
const defaultVals = {
  'jobs/status': {status: 'off'},

  'users/user/get': null,
  'users/people/get': [],

  'users/profile/get': {
    first_name: '',
    last_name: '',
    gender: null,
    orientation: null,
    birthday: '',
    timezone: null,
    bio: '',
    therapist: false
  },

  'entries/entries/get': {arr: [], obj: {}},
  'entries/notes/get': [],
  // entriesIds: [],
  // entriesObj: {},

  'tags/tags/get': [],
  selectedTags: {},

  'fields/fields/get': {},
  'fields/history/get': [],
  'fields/field_entries/get': {},
  fieldValues: {},
  'insights/influencers/get': {},

  'groups/mine/get': {arr: [], obj: {}},
  'groups/groups/get': {arr: [], obj: {}},
  'groups/group/get': {},
  'groups/messages/get': [],
  'groups/members/get': {arr: [], obj: {}},
  'groups/entries/get': {arr: [], obj: []},

  'insights/books/get': [],
  // 'insights/question/post'

  'shares/ingress/get': [],
  'shares/egress/get': []
}

const custom = {
  'set_groups/message/get': action((state, data) => {
    const k = 'groups/messages/get'
    state.data[k] = [...state.data[k], data]
  }),

  'set_tags/tags/get': action((state, data) => {
    state.data['tags/tags/get'] = data
    state.data.selectedTags = _.reduce(data, (m,v,k) => {
        if (v.selected) {m[v.id] = true}
        return m
      }, {})
  }),

  'set_users/profile/put': action((state, data) => {
    data.timezone = _.find(timezones, t => t.value === data.timezone)
    state.data['users/profile/put'] = data
  }),

  'set_fields/field_entries/get': action((state, data) => {
    const obj = _.keyBy(data, 'field_id')
    state.data['fields/field_entries/get'] = obj
    state.data.fieldValues = _.mapValues(obj, 'value')
  }),

  setFieldValue: action((state, payload) => {
    state.data.fieldValues = {...state.data.fieldValues, ...payload}
  })
}

export const store = {
  ...custom,

  emit: thunk(async (actions, payload, helpers) => {
    const jwt = await getJwt()
    let {as: as_user} = helpers.getStoreState().user
    let [action, data] = payload

    // set sending. Clears data & error
    actions.setRes({action, data: {sending: true}})
    // actions.setData({action, data: {}})

    const body = {jwt, as_user, action, data}
    console.log(body)
    ws.send(JSON.stringify(body))
  }),

  // Each emit([action, data]) will return a response {action, code, error, detail, data}
  // Unpack those into response & data separately. Use `res` to get error-codes, and `data` to get values

  // Tracks the response values {code, error, action,
  res: {},
  setRes: action((state, res) => {
    const {data, ...rest} = res
    state.res[res.action] = rest
  }),
  clear: action((s, actions) => {
    actions.forEach(a => {
      s.res[a] = null
      s.data[a] = null
    })
  }),
  // Tracks actual response data
  data: defaultVals,
  setData: action((state, res) => {
    let {data, action, keyby, action_as, op} = res

    // Handle special responses (redirects, key-by for arr/obj, and opts
    if (keyby) {
      data = {
        arr: _.map(data, d => _.get(d, keyby)),
        obj: _.reduce(data, (m, v) => ({...m, [_.get(v, keyby)]: v}), {})
      }
    }

    action = action_as || action
    if (!op) {
      state.data[action] = data
      return
    }

    const curr = state.data[action]
    if (~['update', 'prepend', 'append'].indexOf(op)) {
      curr.obj = {...curr.obj, ...data.obj}
    }
    if (~['prepend', 'append'].indexOf(op)) {
      curr.arr = op === 'prepend' ? [...data.arr, ...curr.arr] : [...curr.arr, ...data.arr]
    }
  }),

  onAny: thunk(async (actions, res, helpers) => {
    const {setRes, setData} = helpers.getStoreActions().ws

    if (res.error == "INVALID_JWT") {
      return Auth.logout()
    }

    // Push response to listeners
    setRes(res)
    EE.emit('wsResponse', res)

    // Don't set the data if there's an error
    if (res.code !== 200) {return}

    // Transform data if necessary, otherwise set it as-is on action-key
    const customFn = actions[`set_${res.action}`]
    if (customFn) {
      customFn(res.data)
    } else {
      setData(res)
    }

    // if (err.title === "JWT_EXPIRED") {
    //   // TODO setup refresh via socketio
    //   data['jwt'] = refreshToken(helpers)
    //   // return ws.emit("server/auth/refresh", {jwt})
    //   return ws.emit(`${payload[0]}`, data, resolve)
    // } else {
    //   console.error(err)
    //   setError(err.message)
    // }
  })
}

export function useSockets() {
  const emit = useStoreActions(actions => actions.ws.emit)
  const jwt = useStoreState(s => s.user.jwt)
  const onAny = useStoreActions(actions => actions.ws.onAny)
  const onAnyInsights = useStoreActions(actions => actions.insights.onAny)
  const onAnyUsers = useStoreActions(actions => actions.user.onAny)
  const setError = useStoreActions(actions => actions.server.setError)

  function connect() {
    // don't initialize for browsing home page
    if (!jwt) {return}
    ws = true

    console.log("-----Setup Socket.io-----")
    ws = new WebSocket(`${WS_URL}/ws?token=` + jwt)

    ws.onopen = function() {
      emit(['users/user/everything', {}])
    }

    ws.onmessage = function(message) {
      const data = JSON.parse(message.data)
      onAny(data)

      const split = data.action.split('/')
      const [klass, action] = [split[0], split.slice(1).join('/')]
      if (data.action !== 'jobs/status') {
        console.log(klass, action, data)
      }
      const fn = {
        insights: onAnyInsights,
        users: onAnyUsers,
      }[klass]
      if (!fn) {return}
      fn([action, data])
    }

    ws.onerror = function(err) {
      setError(err)
    }

    ws.onclose = function(e) {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
      setTimeout(function() {
        connect();
      }, 1000);
    };

    ws.onerror = function(err) {
      console.error('Socket encountered error: ', err.message, 'Closing socket');
      ws.close();
    };

    return ws.close
  }

  useEffect(() => {
    return connect()
  }, [jwt])
}
