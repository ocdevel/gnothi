import React, {useState, useEffect} from 'react'
import {Alert, Button} from 'react-bootstrap'
import {useStoreState} from "easy-peasy";
import {EE} from './redux/ws'

export default function Error({
  message=null,  // manual
  action=null,  // regex
  codes=null
}) {
  const [details, setDetails] = useState([])

  useEffect(() => {
    if (!(action || codes)) {return}
    EE.on("wsResponse", checkWsReponse)
    return () => EE.off("wsResponse")
  }, [])

  useEffect(() => {
    if (message) {addDetail(message)}
    else {clearDetails()}
  }, [message])

  function addDetail(detail) {
    if (!detail?.length) {return}
    setDetails([...details, detail])
  }

  function clearDetails() {setDetails([])}

  function checkWsReponse(data) {
    const cm = codes && ~codes.indexOf(data.code)
    const am = action && data.action?.match(action)
    const match = (codes && action) ? (cm && am) : (cm || am)
    if (match) {
      addDetail(data.detail)
    }
  }

  if (!details.length) {return null}

  return (
    <Alert variant="danger" onClose={clearDetails} dismissible>
      {/*<Alert.Heading>Oh snap! You got an error!</Alert.Heading>*/}
      {details.map(d => <div key={d}>{d}</div>)}
    </Alert>
  );
}
