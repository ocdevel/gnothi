import {shallow} from "zustand/shallow";
import useWebSocket from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "../store";
import {z} from 'zod'
import type {WebSocketHook} from "react-use-websocket/dist/lib/types";
import Typography from "@mui/material/Typography";
import {API_WS} from '../..//utils/config'
import {Auth} from 'aws-amplify'
import {WebSocketEvents} from "vitest";

export default function useApi(): void {
  const [
    authenticated,
    setReadyState,
    setLastJsonMessage,
    setSendJsonMessage,
    addError,
  ] = useStore(s => [
    s.authenticated,
    s.setReadyState,
    s.setLastJsonMessage,
    s.setSendJsonMessage,
    s.addError
  ], shallow)
  // For http, we manually get the jwt before each request, just to keep it fresh. websockets needs it for conneciton,
  // so we invalidate it here on error
  const [jwt, setJwt] = useState<string | null>(null)

  const didUnmount = useRef(false);

  async function getJwt() {
    const sess = await Auth.currentSession()
    return sess.getIdToken().getJwtToken()
  }

  useEffect(() => {
    if (!authenticated) {return}
    (async () => {
      setJwt(await getJwt())
    })()
  }, [authenticated])

  // const wsUrlAsync = wsUrl
  const wsUrlAsync = useCallback(() => new Promise<string>((resolve, reject) => {
    if (jwt) { resolve(API_WS) }
  }), [jwt])

  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useWebSocket<Api.Res<any>>(wsUrlAsync, {
    queryParams: {
      idToken: jwt!
    },
    share: true,

    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 20,
    // Exponential back-off
    reconnectInterval: (attemptNumber) =>
      Math.min(Math.pow(2, attemptNumber) * 1000, 10000),

      // onError prop isn't async, so pass it on
    onError: (event) => { onError(event) }
  })

  async function onError(event: WebSocketEventMap['Error']) {
    // most likely cause is a refreshToken (stale jwt).
    const newJwt = await getJwt()
    if (newJwt !== jwt) {
      // easy peasy. Set it, which triggers a new websocket connection
      setJwt(newJwt)
    }
    // wasn't that. Something terrible.
    console.log(event)
    addError(<Typography>Oops! We've hit a hiccup (it's not you, it's us). Try a quick refresh or re-login. Need a hand? Email us at <a href="mailto:gnothi@gnothiai.com">gnothi@gnothiai.com</a> or drop a message on <a href="https://discord.gg/TNEvx2YR" target="_blank">Discord</a> - your account is safe and sound.</Typography>)
  }


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
