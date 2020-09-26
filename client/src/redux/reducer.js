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
  SET_DAYS
} from './actions'

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
  days: 30
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
      console.log(state.selectedTags)
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
    case SET_DAYS:
      state.days = action.payload
      break
  }

  return state
}
