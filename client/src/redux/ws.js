import {action, thunk, createStore, useStoreState, useStoreActions} from 'easy-peasy'
import {API_URL} from './server'
import { useState, useEffect } from 'react';
import io from "socket.io-client";


const host = API_URL.replace(/^https?/, 'ws')
// const host = API_URL

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
}

export function useSocket() {
  const fetch = useStoreActions(actions => actions.server.fetch)
  const setAi = useStoreActions(actions => actions.server.setAi)
  const users = useStoreState(state => state.ws.users)
  const messages = useStoreState(state => state.ws.messages)
  const actions = useStoreActions(actions => actions.ws)
  const [isOnline, setIsOnline] = useState(null);


  function onMessage(message) {
    console.log('Got message from websocket:', message)
    const payload = JSON.parse(message.data)
    const {type, data} = payload
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
  }

  async function setup() {
    // const socket = socketIOClient(`${host}/ws`);

    const socket = io(host, {path: `/ws/socket.io`, upgrade: true});
    // {auth: {token: "123"}}

    const {data} = await fetch({route: 'users2'})
    data.users.forEach(actions.addToUsersList)
    socket.on("FromAPI", data => {
      console.log(data);
    });
  }

  useEffect(() => {
    setup()
  }, [])

  return isOnline;
}
