import React, {useState, useEffect} from 'react'
import Alert from '@mui/material/Alert'
import {useStore} from "../../data/store";
import {ResError} from "@gnothi/schemas/api";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import {shallow} from "zustand/shallow";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";

interface Error {
  message?: string // manual
  event?: RegExp // regex
  codes?: number[]
}

export function ErrorSnack() {
  const [lastRes, errors, setErrors, addError] = useStore(s => [
    s.lastRes,
    s.errors,
    s.setErrors,
    s.addError
  ], shallow)

  useEffect(() => {
    if (lastRes?.error) {
      const console_ = lastRes.code >= 500 ? console.error : console.warn
      console_(lastRes)
      const error = lastRes.data[0].error
      addError(<div><Typography>{error}</Typography><Typography variant="caption">{lastRes.event}</Typography></div>)
    }
  }, [lastRes])
  
  function closeError(i: number) {
    setErrors(errors.filter((_, j) => j !== i))
  }

  function renderError(error: string, i: number) {
    const handleClose = () => closeError(i)
    return <Alert onClose={handleClose} severity="error">
        {error}
      </Alert>
  }

  if (!errors?.length) {return null}
  //// Seems like Snackbar can't stack (multiple), see https://stackoverflow.com/a/67644083
  // return <Snackbar
  //     open={true}
  //     onClose={() => {}}
  //     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  //   >
  return <Stack sx={{
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 9999
  }} spacing={2}>
    <Stack spacing={2} direction="column">
      {errors.map(renderError)}
    </Stack>
   </Stack>
}

/**
 * This is the old error component, which allowed for catching specific events and codes. Eg, if a snooper
 * doesn't have access to a feature, it'd show this there, rather than a red mayday situation. I'm not using it
 * anymore, and need to determine if it provides value anymore, or if I should scrub the codebase of its use
 */
export default function Error({message, event, codes}: Error) {
  const [details, setDetails] = useState<string[]>([])
  const lastRes = useStore(state => state.lastRes)

  useEffect(() => {
    if (!(event || codes)) {return}
    if (!lastRes?.error) { return }
    const cm = codes && ~codes.indexOf(lastRes.code)
    const am = event && lastRes.event?.match(event)
    const match = (codes && event) ? (cm && am) : (cm || am)
    if (match) {
      addDetail(lastRes.error)
    }
  }, [lastRes])

  useEffect(() => {
    if (message) {addDetail(message)}
    else {clearDetails()}
  }, [message])

  function addDetail(detail: string) {
    if (!detail?.length) {return}
    setDetails([...details, detail])
  }

  function clearDetails() {setDetails([])}

  if (!details.length) {return null}

  return (
    <Alert sx={{mb: 2}} severity="error" onClose={clearDetails} dismissible>
      {details.map(d => <div key={d}>{d}</div>)}
    </Alert>
  );
}
