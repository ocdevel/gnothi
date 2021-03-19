import React, {useState, useEffect} from 'react'
import {Alert, Button} from 'react-bootstrap'
import {useStoreState} from "easy-peasy";
import {EE} from './redux/ws'

export default function Error({
  message=null,  // manual
  action=null,  // regex
  codeRange=null
}) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!(action || codeRange)) {return}
    EE.on("wsResponse", checkWsReponse)
    return () => EE.off("wsResponse")
  }, [])

  useEffect(() => {
    setDetail(message || null)
  }, [message])

  function checkWsReponse(data) {
    const cm = data.code >= codeRange[0] && data.code <= codeRange[1]
    const am = action && data.action?.match(action)
    const match = (codeRange && action) ? (cm && am) : (cm || am)
    if (match) {
      setDetail(`${data.error}: ${data.detail}`)
    }
  }

  function close() {
    setDetail(null)
  }

  if (!detail) {
    return null
  }
  return (
    <Alert variant="danger" onClose={close} dismissible>
      {/*<Alert.Heading>Oh snap! You got an error!</Alert.Heading>*/}
      <div>{detail}</div>
    </Alert>
  );
}
