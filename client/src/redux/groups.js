import {action, thunk} from "easy-peasy";
import {sockets} from './ws'

export const store = {
  messages: [],
  setMessages: action((state, payload) => {
    state.messages = payload
  }),
  addMessage: action((state, payload) => {
    state.messages.push(payload)
  }),

  group: {},
  setGroup: action((state, group) => {
    state.group = group
  }),
  fetchGroup: thunk(async (actions, gid, helpers) => {
    const fetch = helpers.getStoreActions().server.fetch
    const {data} = await fetch({route: `groups/${gid}`})
    actions.setGroup(data)
    // actions.emit(['get_members', gid])
  }),

  members: {},
  setMembers: action((state, payload) => {
    state.members = payload
  }),

  online: {},
  setOnline: action((state, payload) => {
    state.online = {...state.online, ...payload}
  }),

  emit: thunk((actions, payload, helpers) => {
    const {ws} = helpers.getStoreState().ws
    let [event, data] = payload
    event = `server/groups/${event}`
    ws.emit(event, data)
  }),

  onAny: thunk((actions, payload, helpers) => {
    console.log(payload)
    if (payload[0] === 'message') {
      actions.addMessage(payload[1][0])
    }
    if (payload[0] === 'online') {
      actions.setOnline(payload[1][0])
    }
    if (payload[0] === 'members') {
      actions.setMembers(payload[1][0])
    }
    if (payload[0] === 'new_member') {
      actions.emit(["get_members", payload[1][0]])
    }
  })
}
