import React, {useState, useEffect} from 'react'
import {ErrorResponse} from '../../data/schemas/events'
import Alert from '@mui/material/Alert'
import {useStore} from "../../data/store";

interface Error {
  message?: string // manual
  event?: RegExp // regex
  codes?: number[]
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
