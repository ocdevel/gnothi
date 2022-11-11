import shallow from "zustand/shallow";
import useWebSocket from "react-use-websocket";
import {Api} from "@gnothi/schemas";
import {useEffect} from "react";
import {useStore} from "../store";
import {z} from 'zod'

export default function useApi(): void {
  const wsUrl = useStore(state => state.wsUrl)
  if (!wsUrl) {
    return
  }
  const [setReadyState, setLastJsonMessage, setSendJsonMessage] = useStore(state =>
    [state.setReadyState, state.setLastJsonMessage, state.setSendJsonMessage],
    shallow
  )
  const {
    readyState,
    lastJsonMessage,
    sendJsonMessage,
  } = useWebSocket<Api.Res<any>>(wsUrl)

  // TODO handle websocket errors (eg connection / 500, not server-sent errors)

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
