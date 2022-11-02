import shallow from "zustand/shallow";
import useWebSocketReal from "react-use-websocket";
import useWebSocketFake from './fake/index'
import {Api} from "../schemas";
import {useEffect} from "react";
import {useStore} from "../store";

const OFFLINE = true
const useWebSocket = OFFLINE ? useWebSocketFake : useWebSocketReal

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
  } = useWebSocket<Api.Res>(wsUrl)

  // TODO handle websocket errors (eg connection / 500, not server-sent errors)

  useEffect(() => {
    setSendJsonMessage(sendJsonMessage)
  }, [sendJsonMessage])

  useEffect(() => {
    console.log(lastJsonMessage)
    if (!lastJsonMessage) {return}
    setLastJsonMessage(lastJsonMessage)
  }, [lastJsonMessage])

  useEffect(() => {
    setReadyState(readyState)
  }, [readyState])
}
