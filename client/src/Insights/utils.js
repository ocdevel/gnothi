import React from "react";
import {CircularProgress} from "@material-ui/core";

export function Spinner({job}) {
  if (!job?.id) {return null}
  return <>
    <CircularProgress />
    <div>
      <small className='text-muted'>
        You are {job.queue} in line, ETA {job.queue * 30}seconds. You can leave this tab & come back.
      </small>
    </div>
  </>
}
