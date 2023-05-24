import {shallow} from "zustand/shallow";
import useWebSocket from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useCallback, useEffect} from "react";
import {useStore} from "../store";
import {z} from 'zod'
import type {WebSocketHook} from "react-use-websocket/dist/lib/types";


export default function useApi(): void {
  const [
    wsUrl,
    setReadyState,
    setLastJsonMessage,
    setSendJsonMessage,
    logout,
  ] = useStore(s => [
    s.wsUrl,
    s.setReadyState,
    s.setLastJsonMessage,
    s.setSendJsonMessage,
    s.logout
  ], shallow)

  // const wsUrlAsync = wsUrl
  const wsUrlAsync = useCallback(() => new Promise<string>((resolve, reject) => {
    if (wsUrl) { resolve(wsUrl) }
  }), [wsUrl])

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } =useWebSocket<Api.Res<any>>(wsUrlAsync, {
    onError: (e) => {
      // FIXME this is the most likely location for a data error, migration, etc to be caught. I need to think of
      // TODO handle websocket errors (eg connection / 500, not server-sent errors)
      // something better, but for the v0->v1 migration, this will log a user out given there's now jwt
      debugger
      // logout()
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
}
