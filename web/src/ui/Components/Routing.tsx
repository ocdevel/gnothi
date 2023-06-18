import {useRouteError} from "react-router-dom";
import React from "react";
export * as Routing from './Routing'
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

type Loading = {label?: string}
export function Loading({label}: Loading) {
  return <Stack direction='row' spacing={1} alignItems='center'>
    <CircularProgress />
    {label && <Typography>Loading {label}...</Typography>}
  </Stack>
}

export function Error() {
  const error = useRouteError();
  console.error(error);

  return (
    <Alert severity="error" >
      <AlertTitle>Client-side error</AlertTitle>
      {error.statusText || error.message}
    </Alert>
  );
}

export function S({children}: React.PropsWithChildren) {
  return <React.Suspense
    fallback={<Loading />}
  >{children}</React.Suspense>}
