import {useStoreState, useStoreActions, thunk} from 'easy-peasy'
import {API_URL} from './server'
import { useState, useEffect } from 'react';
import io, {Manager} from "socket.io-client";
import _ from 'lodash'

const host = API_URL.replace(/^https?/, 'ws')

let initialized = false
export const sockets = {
  manager: null,
  root: null,
  groups: null
}
export function useSockets() {
  const setAi = useStoreActions(actions => actions.server.setAi)
  const jwt = useStoreState(state => state.user.jwt)
  const onAny = useStoreActions(actions => actions.groups.onAny)

  useEffect(() => {
    // don't initialize for browsing home page
    if (!jwt) {return _.noop}

    if (!initialized) {
      console.log("-----Setup Socket.io-----")
      initialized = true
      sockets.manager = new Manager(host, {
        path: `/ws/socket.io`,
        upgrade: true,
        transports: ["websocket", "polling"],
        rejectUnauthorized: false,
        query: {token: jwt}
      });

      sockets.root = sockets.manager.socket('/')
      sockets.root.on("AI_STATUS", data => {
        setAi(data.status)
      })

      sockets.groups = sockets.manager.socket('/groups')
      sockets.groups.onAny((event, ...args) => {
        onAny([event, args])
      })
    }
    return () => {
      initialized = false
      sockets.groups.close()
      sockets.root.close()
    }
  }, [jwt])

  return sockets;
}
