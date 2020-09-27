import {Spinner} from "react-bootstrap";
import React from "react";

export const spinner = <>
  <Spinner animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
  <div>
    <small className='text-muted'>
      AI takes 30 seconds - 1 minute, you can leave this tab & come back.
    </small>
  </div>
</>
