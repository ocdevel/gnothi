import {useStoreState, useStoreActions} from 'easy-peasy'
import {API_URL} from './server'
import { useState, useEffect } from 'react';
import io, {Manager} from "socket.io-client";
import _ from 'lodash'

const host = API_URL.replace(/^https?/, 'ws')

let manager;
export function useSocketManager() {
  const setAi = useStoreActions(actions => actions.server.setAi)
  const jwt = useStoreState(state => state.user.jwt)

  useEffect(() => {
    // don't initialize for browsing home page
    if (!jwt) {return _.noop}

    if (!manager) {
      console.log("-----Setup Socket.io-----")
      manager = true // flag true immediately, so no race condition
      manager = new Manager(host, {
        path: `/ws/socket.io`,
        upgrade: true,
        auth: {token: jwt}
      });

      // manager.socket("/").on(...)
      manager.on("AI_STATUS", data => {
        setAi(data.status)
      })
    }
  }, [jwt])

  return manager;
}

let groups;
export function useGroupsSocket() {
  const mgr = useSocketManager()
  const onAny = useStoreActions(actions => actions.groups.onAny)

  useEffect(() => {
    if (!mgr) {return _.noop}
    groups = manager.socket('/groups')
    groups.onAny((event, ...args) => onAny([event, args]))
    return () => {
      groups = null
      groups.close()
    }
  }, [mgr])

  return groups;
}
