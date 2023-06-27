import {StateCreator} from 'zustand'
import axios from "axios";
import _ from "lodash";
import {WebSocketHook} from "react-use-websocket/dist/lib/types"
import {EventsSlice} from "./events"

import {API_HTTP, API_WS, OFFLINE, AUTHED} from '@gnothi/web/src/utils/config'
import {Events, Api, Users, Routes} from "@gnothi/schemas";
import {ReadyState} from "react-use-websocket";
import {AppSlice} from "./app";
import {Auth} from 'aws-amplify'
import {ulid} from 'ulid'
import {BehaviorsSlice} from "./behaviors";
import {SharingSlice} from "./sharing";
import produce from "immer";

export interface ApiSlice {
  // useWebsocket just proxies everything into this store
  readyState: ReadyState
  setReadyState: (connectionState: ReadyState) => void
  lastJsonMessage: WebSocketHook<Api.Res>["lastJsonMessage"] | null
  setLastJsonMessage: (lastJsonMessage: WebSocketHook<Api.Res>["lastJsonMessage"]) => void
  sendJsonMessage: WebSocketHook<Api.Res>["sendJsonMessage"]
  setSendJsonMessage: (sendJsonMessage: WebSocketHook<Api.Res>["sendJsonMessage"]) => void

  authenticated: boolean
  setAuthenticated: (authenticated: boolean) => void
  logout: () => Promise<void>
  // AmplifyUser, not the user from database
  // user: any

  send: (event: Events.Events, body: object, extra?: {protocol?: "ws" | "http"}) => void
}

// TODO hack to prevent fetching too many times, due to React re-renders.
// Fix at the re-render level, but doing this for now to save money
const lastSent: Record<string,number> = {}

export const apiSlice: StateCreator<
  ApiSlice & EventsSlice & AppSlice & BehaviorsSlice & SharingSlice,
  [],
  [],
  ApiSlice
> = (set, get) => ({
  readyState: ReadyState.UNINSTANTIATED,
  setReadyState: (readyState) => set({readyState}),
  lastJsonMessage: null,
  setLastJsonMessage: (lastJsonMessage) => get().handleEvent(lastJsonMessage),
  sendJsonMessage: () => {}, // noop
  setSendJsonMessage: (sendJsonMessage) => set({sendJsonMessage}),

  authenticated: false,
  setAuthenticated: (authenticated) => {
    if (!authenticated) {
      set({authenticated, user: {as: null, me: null, viewer: null}})
      return
    }
    set({ authenticated })
    // users_everything_request kicked off by wsUrl listener
  },
  logout: async () => {
    await Auth.signOut()
    window.location.href = "/"
  },

  send: async (event, data, extra) => {
    const protocol = extra?.protocol || "ws"

    // Check if last-sent (for the exact same event key) was very recently, if so bail
    if (lastSent[event]) {
      if (Math.abs(Date.now() - lastSent[event]) < 200) { return }
    }
    lastSent[event] = Date.now()

    // const jwt = await getJwt()
    // let {as: as_user} = helpers.getStoreState().user
    // let [action, data] = payload
    // // set sending. Clears data & error
    // actions.setRes({action, data: {sending: true}})
    // // actions.setData({action, data: {}})
    // const body = {jwt, as_user, action, data}
    // console.log(body)
    // ws.send(JSON.stringify(body))

    const request: Api.Req = {
      event,
      data,
    }
    set(produce(state => {
      state.req[event] = data
    }))
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
