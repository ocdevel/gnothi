import React, {useEffect} from 'react'
import Alert from '@mui/material/Alert'
import {useStore} from "../../data/store";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {shallow} from "zustand/shallow";

export default function ErrorSnack() {
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
      const error = lastRes.error?.message || lastRes.data?.[0]?.error || "An error occurred"
      addError(<div>
        <Typography>{error}</Typography>
        <Typography variant="caption">{lastRes.event}</Typography>
      </div>)
    }
  }, [lastRes])
  
  function closeError(i: number) {
    setErrors(errors.filter((_, j) => j !== i))
  }

  function renderError(error: string | JSX.Element, i: number) {
    const handleClose = () => closeError(i)
    return <Alert key={i} onClose={handleClose} severity="error">
      {error}
    </Alert>
  }

  if (!errors?.length) {return null}

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
