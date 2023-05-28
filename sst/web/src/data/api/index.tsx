import {shallow} from "zustand/shallow";
import useWebSocket from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "../store";
import {z} from 'zod'
import type {WebSocketHook} from "react-use-websocket/dist/lib/types";
import Typography from "@mui/material/Typography";
import {API_WS} from '../..//utils/config'

// no need to do useState, this is a global one-time deal
let errorShown = false

export default function useApi(): void {
  const [
    jwt,
    setReadyState,
    setLastJsonMessage,
    setSendJsonMessage,
    addError,
  ] = useStore(s => [
    s.jwt,
    s.setReadyState,
    s.setLastJsonMessage,
    s.setSendJsonMessage,
    s.addError
  ], shallow)

  const didUnmount = useRef(false);

  // const wsUrlAsync = wsUrl
  const wsUrlAsync = useCallback(() => new Promise<string>((resolve, reject) => {
    // can be null, if we're unsetting it
    if (jwt === undefined) { return }
    if (jwt) { resolve(API_WS) }
  }), [jwt])

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } =useWebSocket<Api.Res<any>>(wsUrlAsync, {
    queryParams: {
      idToken: jwt as string
    },

    shouldReconnect: (closeEvent) => {
      // useWebSocket will handle unmounting for you, but this is an example of a
      // case in which you would not want it to automatically reconnect
      return didUnmount.current === false;
    },
    reconnectAttempts: 20,
    // Exponential back-off
    reconnectInterval: (attemptNumber) =>
      Math.min(Math.pow(2, attemptNumber) * 1000, 10000),

    onError: (event) => {
      if (errorShown) {return} // don't bombard them
      addError(<Typography>Oops! We've hit a small hiccup (it's not you, it's us). Try a quick refresh or re-login. Need a hand? Email us at <a href="mailto:gnothi@gnothiai.com">gnothi@gnothiai.com</a> or drop a message on <a href="https://discord.gg/TNEvx2YR" target="_blank">Discord</a> - your account is safe and sound.</Typography>)
      errorShown = true

      // trying to figure out how to get the message out of this Event. When I observe it in debugger, there's nothing
      // of value. e.toString() always gives "[object Object]". I'm just leaving this code here in case maybe
      // there's a situation in which this Event comes with a message; like the server provides an error?
      const errStr = event.toString()
      if (errStr !== "[object Event]") {
        addError(<Typography>{errStr}</Typography>)
      }
    }
  })

  useEffect(() => {
    setSendJsonMessage(sendJsonMessage)
  }, [sendJsonMessage])

  useEffect(() => {
    if (!lastJsonMessage) {return}
    setLastJsonMessage(lastJsonMessage)
  }, [lastJsonMessage])

  useEffect(() => {
    setReadyState(readyState)
  }, [readyState])

  // only time WS reconnection shouldn't retry: unmount
  useEffect(() => () => {didUnmount.current = true}, [])
}
