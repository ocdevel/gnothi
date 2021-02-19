import {action, thunk} from "easy-peasy";

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

  onAny: thunk((actions, payload, helpers) => {
    if (payload[0] === 'message') {
      actions.addMessage(payload[1][0])
    }
  })
}
