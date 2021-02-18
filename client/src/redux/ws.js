import {action, thunk, createStore} from 'easy-peasy'
import {API_URL} from './server'

const host = API_URL.replace(/^https?/, 'ws')

export const store = {
  messages: {},
  setMessages: action((state, payload) => {
    state.messages = payload
  }),

  users: {},
  setUsers: action((state, payload) => {
    state.users = payload
  }),

  message: "",
  setMessage: action((state, payload) => {
    state.message = payload
  }),

  status: "off",
  setStatus: action((state, payload) => {
    state.status = payload
  }),

  addToUsersList: action((state, user_id) => {
    const {users} = state
    state.users = {...users, [user_id]: new Date()}
  }),


  addMessage: thunk( async (actions, msg, helpers) => {
    const {user_id} = msg
    const {messages} = helpers.getState()
    if (user_id === 'error') {msg.error = true}
    if (user_id === 'server') {msg.server = true}
    actions.setMessages({...messages, [new Date()]: msg})
  }),

  /** Handle an incoming message from the websocket connection. */
  onWebsocketMessage: thunk(async (actions, message, helpers) => {
    console.log('Got message from websocket:', message)
    const {setAi} = helpers.getStoreActions().server
    const payload = JSON.parse(message.data)
    const {type, data} = payload
    let {users, messages} = helpers.getState()
    switch(type) {
      case 'JOBS_STATUS':
        setAi(data.status)
        return
      case 'MESSAGE':
      case 'ERROR':
      case 'ROOM_KICK':
        const {msg, user_id} = data
        actions.addMessage({msg, user_id})
        if (type === 'ROOM_KICK') {
          actions.setUsers({})
        }
        break
      case 'USER_JOIN':
        actions.addToUsersList(data)
        actions.addMessage({msg: `**User ${data}** joined the room`, user_id: 'server'})
        break
      case 'USER_LEAVE':
        // FIXME
        // delete ws_users[data]
        actions.addMessage({msg: `**User ${data}** left the room`, user_id: 'server'})
        break
      case 'ROOM_JOIN':
        // setMyUserId(data.user_id);
        actions.addToUsersList(data.user_id);
        break
      default:
        throw new TypeError('Unknown message type: ' + payload.type);
        break
    }
  }),

  ws: {ws: null, interval: null},
  setWs: action((state, ws) => {
    state.ws = ws
  }),

  onWebsocketOpen: action((state, payload) => {
    state.status = 'on'
    if (state.ws.interval) {
      clearInterval(state.ws.interval)
      delete state.ws.interval
    }
  }),

  onWebsocketError: thunk(async (actions, err, helpers) => {
    actions.onWebSocketClose(err)
  }),

  onWebsocketClose: thunk( async (actions, e, helpers) => {
    const {setError} = helpers.getStoreActions().server
    const {ws} = helpers.getState()
    if (typeof e === "string") {
      console.error('Websocket error: ', e)
      setError(e)
      actions.setStatus("off")
    }
    console.log('Closing WebSocket connection');

    if (!ws.interval) {
      ws.interval = setInterval(actions.initWebsocket, 5000)  // try to reconnect
    }
  }),

  fetchRoom: thunk(async (actions, payload, helpers) => {
    const {fetch} = helpers.getStoreActions().server
    const {data} = await fetch({route: 'users2'})
    data.users.forEach(actions.addToUsersList)
  }),

  initWebsocket: thunk(async (actions, payload) => {
    const ws = new WebSocket(`${host}/ws`);
    ws.onopen = actions.onWebsocketOpen;
    ws.onerror = actions.onWebsocketError;
    ws.onclose = actions.onWebsocketClose;
    ws.onmessage = actions.onWebsocketMessage;
    actions.setWs(ws)
  }),
}
