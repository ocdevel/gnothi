import {action, thunk, createStore, useStoreState, useStoreActions} from 'easy-peasy'
import {API_URL} from './server'
import { useState, useEffect } from 'react';
import io, {Manager} from "socket.io-client";


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

let manager;
export function useSocket() {
  const setAi = useStoreActions(actions => actions.server.setAi)
  const jwt = useStoreState(state => state.user.jwt)

  async function setup() {
    // don't initialize for browsing home page
    if (!jwt) {return}

    if (!manager) {
      console.log("-----Setup Socket.io-----")
      manager = true // flag true immediately, so no race condition
      manager = new Manager(host, {
        path: `/ws/socket.io`,
        upgrade: true,
        auth: {token: jwt}
      });

      const socket = manager.socket("/")
      manager.on("AI_STATUS", data => {
        setAi(data.status)
      })
    }
  }

  useEffect(() => {
    setup()
  }, [])

  return manager;
}
