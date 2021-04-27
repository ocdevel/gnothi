import {createStore, action, thunk} from 'easy-peasy'
import _ from "lodash";
import {trueKeys} from "../utils";

export const initialInsights = {
  days: 30,
  question: "",
  themes: "kmeans",
  summarize: 300,
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
    state[k] = v
  }),

  postInsight: thunk(async (actions, k, helpers) => {
    const {emit} = helpers.getStoreActions().ws
    const {insights, ws} = helpers.getStoreState()

    const body = { days: insights.days }
    const tags = trueKeys(ws.data.selectedTags)
    if (tags.length) { body.tags = tags }

    const formK = {question: "question", themes: "algo", summarize: "words"}[k]
    body[formK] = insights[k]

    emit([`insights/${k}/post`, body])
  }),
}
