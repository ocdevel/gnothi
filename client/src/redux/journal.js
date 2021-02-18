import {action, thunk} from "easy-peasy";
import _ from "lodash";

export const store = {
  tags: [],
  selectedTags: {},
  setTags: action((state, payload) => {
    state.tags = payload
    state.selectedTags = _.reduce(payload, (m,v,k) => {
        if (v.selected) {m[v.id] = true}
        return m
      }, {})
  }),
  getTags: thunk(async (actions, payload, helpers) => {
    const {jwt} = helpers.getStoreState().user
    const {fetch} = helpers.getStoreActions().server

    if (!jwt) {return}
    const {data} = await fetch({route: 'tags'})
    actions.setTags(data)
  }),

  influencers: {},
  setInfluencers: action((state, payload) => {
    state.influencers = payload
  }),

  fields: {},
  setFields: action((state, payload) => {
    state.fields = payload
  }),
  getFields: thunk(async (actions, payload, helpers) => {
    const {jwt} = helpers.getStoreState().user
    const {fetch} = helpers.getStoreActions().server

    if (!jwt) {return}
    let {data, code, message} = await fetch({route: 'fields'})
    data = code === 401 ? {code, message} : data
    actions.setFields(data)

    if (code == 200) {
      let {data} = await fetch({route: 'influencers'})
      actions.setInfluencers(data)
    }
  }),

  entries: [],
  setEntries: action((state, payload) => {
    state.entries = payload
  }),
  getEntries: thunk(async (actions, payload, helpers) => {
    const {jwt} = helpers.getStoreState().user
    const {fetch} = helpers.getStoreActions().server

    if (!jwt) {return}
    let {data, code, message} =  await fetch({route: 'entries'})
    data = code === 401 ? {code, message} : data
    actions.setEntries(data)
  }),
}
