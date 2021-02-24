import {action, thunk} from "easy-peasy";
import {sockets} from './ws'

function onUserJoin(data) {
  // actions.addToUsersList(data)
  // actions.addMessage({msg: `**User ${data}** joined the room`, user_id: 'server'})
}

function onUserLeave(data) {
  // actions.addMessage({msg: `**User ${data}** left the room`, user_id: 'server'})
}

function onRoomJoin(data) {
  // actions.addToUsersList(data.user_id);
}

function onRoomKick(data) {
  // actions.setUsers({})
}

export const store = {
  messages: [],
  setMessages: action((state, payload) => {
    state.messages = payload
  }),
  addMessage: action((state, payload) => {
    state.messages.push(payload)
  }),

  online: [],
  setOnline: action((state, payload) => {
    state.online = payload
  }),

  emit: thunk((actions, payload, helpers) => {
    const {jwt} = helpers.getStoreState().user
    const [event, data] = payload
    sockets.groups.emit(event, data)
  }),

  onAny: thunk((actions, payload, helpers) => {
    console.log(payload)
    if (payload[0] === 'message') {
      actions.addMessage(payload[1][0])
    }
    if (payload[0] === 'users') {
      actions.setOnline(payload[1][0])
    }
  })
}
