import {Spinner as Spinner_} from "react-bootstrap";
import React from "react";

export function Spinner({job}) {
  const {code, message, data} = job
  if (!(data && data.jid)) {return null}
  return <>
    <Spinner_ animation="border" role="status">
      <span className="sr-only">Loading...</span>
    </Spinner_>
    <div>
      <small className='text-muted'>
        You are {data.queue} in line, ETA {data.queue * 30}seconds. You can leave this tab & come back.
      </small>
    </div>
  </>
}
