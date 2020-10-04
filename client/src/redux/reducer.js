import _ from 'lodash'
import {
  SET_SERVER_ERROR,
  SET_USER,
  SET_JWT,
  SET_AS,
  SET_AS_USER,
  SET_AI_STATUS,
  SET_TAGS,
  SET_FIELDS,
  SET_INFLUENCERS,
  SET_ENTRIES,
  SET_INSIGHTS
} from './actions'

const emptyRes = {code: null, message: null, data: null}

const initialState = {
  jwt: localStorage.getItem('jwt'),
  user: null,
  as: null,
  asUser: null,
  tags: [],
  selectedTags: {},
  aiStatus: 'off',
  serverError: null,
  fields: {},
  influencers: {},
  entries: [],

  insights: {
    days: 30,

    ask_fetching: false,
    ask_req: "",
    ask_res1: emptyRes,
    ask_res2: emptyRes,

    themes_fetching: false,
    themes_req: "kmeans",
    themes_res1: emptyRes,
    themes_res2: emptyRes,

    summarize_fetching: false,
    summarize_req: 300,
    summarize_res1: emptyRes,
    summarize_res2: emptyRes
  }
}

export default function mainReducer(state, action) {
  if (typeof state === 'undefined') {
    return initialState
  }

  switch(action.type){
    case SET_SERVER_ERROR:
      state.serverError = action.payload
      break
    case SET_USER:
      state.user = action.payload
      break
    case SET_JWT:
      state.jwt = action.payload
      break
    case SET_AS:
      state.as = action.payload
      state.asUser = !action.payload ? null
        : _.find(state.user.shared_with_me, {id: action.payload})
      state.insights = initialState.insights
      break
    // case SET_AS_USER:
    //   state.asUser = action.payload
    //   break
    case SET_AI_STATUS:
      state.aiStatus = action.payload
      break
    case SET_TAGS:
      state.tags = action.payload
      state.selectedTags = _.reduce(action.payload, (m,v,k) => {
        if (v.selected) {m[v.id] = true}
        return m
      }, {})
      break
    case SET_FIELDS:
      state.fields = action.payload
      break
    case SET_INFLUENCERS:
      state.influencers = action.payload
      break
    case SET_ENTRIES:
      state.entries = action.payload
      break
    case SET_INSIGHTS:
      state.insights = {...state.insights, ...action.payload}
      break
  }

  return state
}
