import {action, thunk} from "easy-peasy";

export const store = {
  messages: [],
  setMessages: action((state, payload) => {
    state.messages = payload
  }),
  addMessage: action((state, payload) => {
    state.messages = [...state.messages, payload]
  }),

  group: {},
  setGroup: action((state, group) => {
    state.group = group
  }),

  groups: [],
  setGroups: action((state, groups) => {
    state.groups = groups
  }),

  members: {},
  setMembers: action((state, payload) => {
    state.members = payload
  }),

  online: {},
  setOnline: action((state, payload) => {
    state.online = {...state.online, ...payload}
  }),

  onAny: thunk((actions, payload, helpers) => {
    const {emit} = helpers.getStoreState().ws
    let [event, data] = payload
    data = data[0]
    if (event === 'message') {
      actions.addMessage(data)
    } else if (event === 'messages') {
      actions.setMessages(data)
    } else if (event === 'online') {
      actions.setOnline(data)
    } else if (event === 'members') {
      actions.setMembers(data)
    } else if (event === 'group') {
      actions.setGroup(data)
    } else if (event === 'groups') {
      actions.setGroups(data)
    }
  })
}
