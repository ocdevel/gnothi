import {ReadyState} from "react-use-websocket";
import {Api} from "../../schemas";
import React, {useState, useEffect} from "react";
import {JsonValue, Options, WebSocketHook} from "react-use-websocket/src/lib/types";
import {DEFAULT_OPTIONS} from "react-use-websocket/src/lib/constants";
import {handlers, handler} from './handlers'

// signature copy/pasted from react-use-websocket, sure there's
// a smarter TypeScript way to `typeof` this
const useWebSocketFake = <T extends JsonValue | null = JsonValue | null>(
  url: string | (() => string | Promise<string>) | null,
  options: Options = DEFAULT_OPTIONS,
  connect: boolean = true,
): WebSocketHook<T> => {
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.UNINSTANTIATED)
  const [lastJsonMessage, setLastJsonMessage] = useState<Api.Res | null>(null)

  const sendJsonMessage = React.useCallback((message) => {
    handler(message)
  }, [])

  useEffect(() => {
    setTimeout(() => {setReadyState(ReadyState.OPEN)}, 100)
  }, [])

  return {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  }
}

export default useWebSocketFake
