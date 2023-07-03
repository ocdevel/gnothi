import {shallow} from "zustand/shallow";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "../store";
import {z} from 'zod'
import type {WebSocketHook} from "react-use-websocket/dist/lib/types";
import Typography from "@mui/material/Typography";
import {API_WS, DISCORD_LINK} from '../../utils/config'
import {Auth} from 'aws-amplify'
import {WebSocketEvents} from "vitest";
import {useDebouncedCallback} from "use-debounce";

// Need to get a little tricky in this file. Previously I was trigging a users_everything_request on
// readyState===ready. But that changes for each jwt refresh, which triggers re-fetching the user every 5 minutes.
// So I took control of that check from <Auth /> and moved it here, only to trigger on first auth. Now... since
// the hook holds the websocket, which is the crux of everything in this app, I need it to "re-render" (delete
// and recreate the websocket) only when necessary. To ensure that, I'm using store.getState() to call into the
// store, and only listening on variables inside the hook whose changes warrant a re-render.
const get = useStore.getState

let everythingRequestSent = false

export default function useApi(): void {
  const authenticated = useStore(s => s.authenticated)

  // For http, we manually get the jwt before each request, just to keep it fresh. websockets needs it for conneciton,
  // so we invalidate it here on error. Only place it should be kept around in any way.
  const [jwt, setJwt] = useState<string | null>(null)

  const didUnmount = useRef(false);

  // const wsUrlAsync = wsUrl
  const wsUrlAsync = useCallback(() => new Promise<string>((resolve, reject) => {
    if (jwt) { resolve(API_WS) }
  }), [jwt])

  const {
    lastJsonMessage,
    sendJsonMessage,
    readyState,
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
    // get().addError(<Typography>Oops! We've hit a hiccup (it's not you, it's us). Try a quick refresh or re-login. Need a hand? Email us at <a href="mailto:gnothi@gnothiai.com">gnothi@gnothiai.com</a> or drop a message on <a href={DISCORD_LINK} target="_blank">Discord</a> - your account is safe and sound.</Typography>)
  }

  async function getJwt() {
    const sess = await Auth.currentSession()
    return sess.getIdToken().getJwtToken()
  }

  async function onFirstAuth(authed: boolean) {
    if (!authed) {return}


    // TODO this shouldn't be necessary. The useEffect(...[authenticated]) is triggering twice for true
    if (everythingRequestSent) {return}
    everythingRequestSent = true

    setJwt(await getJwt())

    // useWebSocket will queue it up intelligently, if websocket isn't yet open
    // get().send('users_everything_request', {})
    // Actually, break the rule of `send()` and use the websocket method here directly. I'm worried about circular
    // dependency or race condition. It actually worked fine, but I'm following my gut here. The WS portion of send()
    // is just this simple code anyway, so no harm
    sendJsonMessage({event: "users_everything_request", data: {}})
  }

  useEffect(() => { onFirstAuth(authenticated) }, [authenticated])

  useEffect(() => {
    // Set the literal function. This will be used inside our send() calls from now on
    get().setSendJsonMessage(sendJsonMessage)
    // not currently using it for anything, but may in the future.
    get().setReadyState(readyState)
  }, [sendJsonMessage, readyState])

  useEffect(() => {
    if (!lastJsonMessage) {return}
    get().setLastJsonMessage(lastJsonMessage)
  }, [lastJsonMessage])

  // only time WS reconnection shouldn't retry: unmount
  useEffect(() => () => {didUnmount.current = true}, [])
}
