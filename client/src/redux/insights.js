import {createStore, action, thunk} from 'easy-peasy'
import moment from "moment-timezone"
import _ from "lodash";
import {trueKeys} from "../utils";

const emptyRes = {code: null, message: null, data: null}
export const initialInsights = {
  days: 30,

  ask: {
    fetching: false,
    req: "",
    res1: emptyRes,
    res2: emptyRes,
  },

  themes: {
    fetching: false,
    req: "agglomorative",
    res1: emptyRes,
    res2: emptyRes,
  },

  summarize: {
    fetching: false,
    req: 300,
    res1: emptyRes,
    res2: emptyRes
  }
}

export const store = {
  ...initialInsights,

  setDays: action((state, payload) => {
    state.days = payload
  }),

  clearInsights: action((state, k) => {
    if (k === 'all') {
      _.each(initialInsights, (v, k) => {state[k] = v})
    } else {
      state[k] = initialInsights[k]
    }
  }),

  setInsight: action((state, payload) => {
    const [k, v] = payload
    state[k] = {...state[k], ...v}
  }),

  getInsight: thunk(async (actions, k, helpers) => {
    const {fetch} = helpers.getStoreActions().server
    const state = helpers.getStoreState()
    const {insights} = state
    const {selectedTags} = state.j
    const insight = insights[k]

    actions.setInsight([k, {fetching: true, res1: {}}])

    const body = { days: insights.days }
    const tags = trueKeys(selectedTags)
    if (tags.length) { body.tags = tags }

    if (k === 'ask') {
      body.question = insight.req
    } else if (k === 'themes') {
      body.algo = insight.req
    } else if (k === 'summarize') {
      body.words = insight.req
    }
    let res = await fetch({route: k, method: 'POST', body})
    actions.setInsight([k, {res1: res}])
    const {jid} = res.data
    if (!jid) {
      return actions.setInsight([k, {fetching: false}])
    }
    res = await fetch({route: `await-job/${jid}`})
    actions.setInsight([k, {res2: res, fetching: false}])
  })
}
