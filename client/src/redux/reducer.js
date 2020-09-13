import _ from 'lodash'
import {
  SET_SERVER_ERROR,
  SET_USER,
  SET_JWT,
  SET_AS,
  SET_AS_USER,
  SET_AI_STATUS,
  SET_TAGS,
  SET_SELECTED_TAGS
} from './actions'

const initialState = {
  jwt: localStorage.getItem('jwt'),
  user: null,
  as: null,
  asUser: null,
  tags: [],
  selectedTags: {},
  aiStatus: 'off',
  serverError: null
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
      break
    case SET_SELECTED_TAGS:
      let obj = {...state.selectedTags, ...action.payload}
      obj = _.pickBy(obj, v=>v) // remove false
      state.selectedTags = obj
      break
  }

  return state
}
