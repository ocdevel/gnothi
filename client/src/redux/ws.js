import {useStoreState, useStoreActions, action, thunk} from 'easy-peasy'
import {API_URL, refreshToken} from './server'
import { useState, useEffect } from 'react';
import io, {Manager} from "socket.io-client";
import _ from 'lodash'

const host = API_URL.replace(/^https?/, 'ws')
let ws;

export const store = {
  ready: false,
  setReady: action((state, payload) => {
    state.ready = true
  }),

  emit: thunk(async (actions, payload, helpers) => {
    return new Promise((resolve, reject) => {
      let {jwt, as} = helpers.getStoreState().user
      const {setError} = helpers.getStoreActions().server
      if (!jwt) {return resolve(null)}
      if (!ws) {return resolve()}

      const data = {data: payload[1], jwt, as_user: as}
      ws.emit(`server/${payload[0]}`, data, (res) => {
        if (!res) {return resolve()}
        const err = res.error
        if (!err) {return resolve(res)}

        if (err.title === "JWT_EXPIRED") {
          // TODO setup refresh via socketio
          data['jwt'] = refreshToken(helpers)
          // return ws.emit("server/auth/refresh", {jwt})
          return ws.emit(`server/${payload[0]}`, data, resolve)
        } else {
          console.error(err)
          setError(err.message)
        }
      })
    })
  })
}

export function useSockets() {
  const emit = useStoreActions(actions => actions.ws.emit)
  const setReady = useStoreActions(actions => actions.ws.setReady)
  const jwt = useStoreState(state => state.user.jwt)
  const setAi = useStoreActions(actions => actions.server.setAi)
  const onAnyGroups = useStoreActions(actions => actions.groups.onAny)
  const onAnyUsers = useStoreActions(actions => actions.user.onAny)

  function close() {
    // ws.close()
    // ws = null
  }

  useEffect(() => {
    // don't initialize for browsing home page
    if (!jwt) {return}
    if (ws) {return close}
    ws = true

    console.log("-----Setup Socket.io-----")
    ws = io(host, {
      path: `/ws/socket.io`,
      upgrade: true,
      transports: ["websocket", "polling"],
      rejectUnauthorized: false,
    })

    // check if we need to refresh first (future calls will do the same)
    emit(["auth/jwt", {}])

    ws.on("AI_STATUS", data => {
      setAi(data.status)
    })

    ws.onAny((event, ...args) => {
      const nsp = event.split('/')
      if (nsp[0] !== 'client') {return}
      if (nsp[1] == 'groups') {
        return onAnyGroups([nsp[2], args])
      }
      if (nsp[1] == 'users') {
        return onAnyUsers([nsp[2], args])
      }
    })

    setReady(true)

    return close
  }, [])

  return ws;
}
