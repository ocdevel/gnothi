import React, {useState, useEffect} from 'react'
import Alert from '@mui/material/Alert'
import {useStore} from "../../data/store";
import {ResError} from "@gnothi/schemas/api";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";

interface Error {
  message?: string // manual
  event?: RegExp // regex
  codes?: number[]
}

export function ErrorSnack() {
  const lastRes = useStore(state => state.lastRes)
  const [errors, setErrors] = useState<ResError[]>([])
  
  useEffect(() => {
    if (lastRes?.error) {
      setErrors([...errors, lastRes])
      console.error(lastRes)
    }
  }, [lastRes])
  
  function closeError(i: number) {
    setErrors(errors.filter((_, j) => j !== i))
  }

  function renderError(e: ResError, i: number) {
    const handleClose = () => closeError(i)
    return <Alert onClose={handleClose} severity="error">
        <Typography>{e.data} | {e.code} | {e.event}</Typography>
      </Alert>
  }

  if (!errors?.length) {return null}
  //// Seems like Snackbar can't stack (multiple), see https://stackoverflow.com/a/67644083
  // return <Snackbar
  //     open={true}
  //     onClose={() => {}}
  //     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  //   >
  return <Stack sx={{ position: "absolute", bottom: 24, right: 24 }} spacing={2}>
    <Stack spacing={2} direction="column">
      {errors.map(renderError)}
    </Stack>
   </Stack>
}

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
