import React, {useState, useEffect} from 'react'
import {Alert, Button} from 'react-bootstrap'

export default function Error({message=null}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!!message)
  }, [message])

  if (!show) {return null}
  return (
    <Alert variant="danger" onClose={() => setShow(false)} dismissible>
      {/*<Alert.Heading>Oh snap! You got an error!</Alert.Heading>*/}
      <div>{message}</div>
    </Alert>
  );
}
