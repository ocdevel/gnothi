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

interface ErrorProps {
  /**
   * Event regex to match against. If provided, will only show errors from matching events
   * Example: /shares\/email\/check/g
   */
  event?: RegExp
  /**
   * HTTP status codes to match against. If provided, will only show errors with matching codes
   * Example: [400, 404]
   */
  codes?: number[]
  /**
   * Manual error message to display. If provided, will show this message instead of listening for errors
   */
  message?: string
  /**
   * Whether to show as an inline error (default) or as a snackbar
   */
  variant?: 'inline' | 'snackbar'
  /**
   * Additional styles to apply to the Alert component
   */
  sx?: any
}

/**
 * Error component that can either show manual messages or listen for specific types of errors.
 * Can be used both inline (next to form fields) or as a snackbar.
 *
 * @example
 * // Show all email check errors inline
 * <Error event={/shares\/email\/check/g} codes={[400, 404]} />
 *
 * // Show a manual error as a snackbar
 * <Error message="Something went wrong" variant="snackbar" />
 */
export default function Error({message, event, codes, variant = 'inline', sx}: ErrorProps) {
  const lastRes = useStore(state => state.lastRes, shallow)
  const addError = useStore(state => state.addError)

  // If it's a manual message and snackbar variant, add it to global errors
  React.useEffect(() => {
    if (message && variant === 'snackbar') {
      addError(message)
      return
    }
  }, [message])

  // For manual inline messages, just show them directly
  if (message && variant === 'inline') {
    return (
      <Alert severity="error" sx={{mb: 2, ...sx}}>
        {message}
      </Alert>
    )
  }

  // For event/code matching, check if we have a matching error
  if (event || codes) {
    if (!lastRes?.error) return null

    const codeMatches = codes ? codes.includes(lastRes.code) : true
    const eventMatches = event ? event.test(lastRes.event) : true
    const matches = (codes && event) ? (codeMatches && eventMatches) : (codeMatches || eventMatches)

    if (!matches) return null

    const errorMessage = lastRes.error?.message || lastRes.data?.[0]?.error || "An error occurred"

    if (variant === 'snackbar') {
      addError(errorMessage)
      return null
    }

    return (
      <Alert severity="error" sx={{mb: 2, ...sx}}>
        {errorMessage}
      </Alert>
    )
  }

  return null
}