import {StateCreator} from 'zustand'
import EventEmitter from 'eventemitter3'
import axios from "axios";
import _ from "lodash";
import {WebSocketHook} from "react-use-websocket/dist/lib/types"
import {EventsSlice} from "./events"

import {API_HTTP, API_WS, OFFLINE, AUTHED} from '@gnothi/web/src/utils/config'
import {Events, Api, Users, Routes} from "@gnothi/schemas";
import {ReadyState} from "react-use-websocket";
import {AppSlice} from "./app";
import {Auth} from 'aws-amplify'

export interface ApiSlice {
  // Used to connect to the websocket
  wsUrl?: string

  // useWebsocket just proxies everything into this store
  readyState: ReadyState
  setReadyState: (connectionState: ReadyState) => void
  lastJsonMessage: WebSocketHook<Api.Res>["lastJsonMessage"] | null
  setLastJsonMessage: (lastJsonMessage: WebSocketHook<Api.Res>["lastJsonMessage"]) => void
  sendJsonMessage: WebSocketHook<Api.Res>["sendJsonMessage"]
  setSendJsonMessage: (sendJsonMessage: WebSocketHook<Api.Res>["sendJsonMessage"]) => void

  jwt: string | undefined
  setJwt: (jwt: string | undefined) => Promise<void>
  logout: () => Promise<void>
  // AmplifyUser, not the user from database
  // user: any

  send: (event: Events.Events, body: object, protocol?: "ws" | "http") => void

  apiError?: string,
  setApiError: (error: string) => void
}

export const apiSlice: StateCreator<
  ApiSlice & EventsSlice & AppSlice,
  [],
  [],
  ApiSlice
> = (set, get) => ({
  wsUrl: undefined,

  readyState: ReadyState.UNINSTANTIATED,
  setReadyState: (readyState) => {
    if (readyState === ReadyState.OPEN) {
      get().send('users_everything_request', {})
    }
    set({readyState})
  },
  lastJsonMessage: null,
  setLastJsonMessage: (lastJsonMessage) => get().handleEvent(lastJsonMessage),
  sendJsonMessage: () => {}, // noop
  setSendJsonMessage: (sendJsonMessage) => set({sendJsonMessage}),

  jwt: undefined,
  setJwt: async (jwt) => {
    if (get().jwt === jwt) {return}
    if (!jwt) {
      set({jwt, wsUrl: API_WS, user: {as: null, me: null, viewer: null}})
      return
    }
    set({
      jwt,
      wsUrl: `${API_WS}?idToken=${jwt}`
    })
    get().send("users_everything_request", {})
  },
  logout: async () => {
    await Auth.signOut()
    window.location.href = "/"
  },

  apiError: undefined,
  setApiError: (apiError) => set({apiError}),

  send: async (event, data, protocol='ws') => {
    // const jwt = await getJwt()
    // let {as: as_user} = helpers.getStoreState().user
    // let [action, data] = payload
    // // set sending. Clears data & error
    // actions.setRes({action, data: {sending: true}})
    // // actions.setData({action, data: {}})
    // const body = {jwt, as_user, action, data}
    // console.log(body)
    // ws.send(JSON.stringify(body))

    const request: Api.Req = {event, data}
    if (protocol === 'ws') {
      // ws response will come in useSend, then call back here to handler
      return get().sendJsonMessage(request)
    }

    const httpResponse = await axios({
      method: 'POST',
      url: API_HTTP, // all routes are `POST /`
      data: request,
      withCredentials: false
    })
    get().handleEvent(httpResponse.data)

    // const {
    //   route,
    //   method = 'GET',
    //   body = null,
    //   headers = {}
    // } = payload
    //
    // let {jwt, user, as} = helpers.getStoreState().user
    //
    // const obj = {
    //   method,
    //   headers: {'Content-Type': 'application/json', ...headers},
    // };
    //
    // if (body) obj['data'] = body
    // if (jwt) obj['headers']['Authorization'] = `Bearer ${jwt}`
    // // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
    // let url = `${API_URL}/${route}`
    // if (as && user && as !== user.id) {
    //   url += (~route.indexOf('?') ? '&' : '?') + `as_user=${as}`
    // }
    // obj['url'] = url
    //
    // try {
    //   const {status: code, data} = await axios(obj)
    //   return {code, data}
    // } catch (error) {
    //   let {status: code, statusText: message, data} = error.response
    //   message = data.detail || message || "There was an error"
    //
    //   if (data.jwt_error) {
    //     // try refreshing the token, then try again
    //     // jwt = await refreshToken(helpers)
    //     if (jwt) {
    //       obj['headers']['Authorization'] = `Bearer ${jwt}`
    //       try {
    //         const {status: code, data} = await axios(obj)
    //         return {code, data}
    //       } catch {
    //         // Couldn't fix via refresh-token. carry on to error-handling below.
    //       }
    //     }
    //   }
    //
    //   // Show errors, but not for 401 (we simply restrict access to components)
    //   if (code >= 400 && code !== 401) {
    //     actions.setError(message)
    //   }
    //   return {code, message, data}
    // }
  },
})


export const EE = new EventEmitter()
