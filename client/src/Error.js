import React, {useState, useEffect} from 'react'
import {Alert, Button} from 'react-bootstrap'
import {useStoreState} from "easy-peasy";
import {EE} from './redux/ws'

export default function Error({
  message=null,  // manual
  action=null,  // regex
  codes=null
}) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!(action || codes)) {return}
    EE.on("wsResponse", checkWsReponse)
    return () => EE.off("wsResponse")
  }, [])

  useEffect(() => {
    setDetail(message || null)
  }, [message])

  function checkWsReponse(data) {
    const cm = codes && ~codes.indexOf(data.code)
    const am = action && data.action?.match(action)
    const match = (codes && action) ? (cm && am) : (cm || am)
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
