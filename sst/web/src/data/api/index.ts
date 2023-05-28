import {shallow} from "zustand/shallow";
import useWebSocket from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useCallback, useEffect, useRef} from "react";
import {useStore} from "../store";
import {z} from 'zod'
import type {WebSocketHook} from "react-use-websocket/dist/lib/types";


export default function useApi(): void {
  const [
    wsUrl,
    setReadyState,
    setLastJsonMessage,
    setSendJsonMessage,
    addError,
  ] = useStore(s => [
    s.wsUrl,
    s.setReadyState,
    s.setLastJsonMessage,
    s.setSendJsonMessage,
    s.addError
  ], shallow)

  const didUnmount = useRef(false);

  // const wsUrlAsync = wsUrl
  const wsUrlAsync = useCallback(() => new Promise<string>((resolve, reject) => {
    if (wsUrl) { resolve(wsUrl) }
  }), [wsUrl])

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } =useWebSocket<Api.Res<any>>(wsUrlAsync, {

    shouldReconnect: (closeEvent) => {
      // useWebSocket will handle unmounting for you, but this is an example of a
      // case in which you would not want it to automatically reconnect
      return didUnmount.current === false;
    },
    reconnectAttempts: 20,
    // Exponential back-off
    reconnectInterval: (attemptNumber) =>
      Math.min(Math.pow(2, attemptNumber) * 1000, 10000),

    onError: (e) => {
      addError("Problem connecting. Try refreshing; or logging out/in; or contact gnothi@gnothiai.com")

      // trying to figure out how to get the message out of this Event. When I observe it in debugger, there's nothing
      // of value. e.toString() always gives "[object Object]". I'm just leaving this code here in case maybe
      // there's a situation in which this Event comes with a message; like the server provides an error?
      const errStr = e.toString()
      if (errStr !== "[object Event]") {
        addError(errStr)
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
