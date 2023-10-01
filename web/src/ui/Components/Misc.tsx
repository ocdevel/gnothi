import Alert, {AlertProps} from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Stack, {StackProps} from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as React from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

const GAP = 2

type AlertProps2 = AlertProps & {title?: string, noTop?: boolean}
export function Alert2(props: AlertProps2) {
  const {title, children, noTop, ...rest} = props
  const sx = noTop ? {mb: GAP} : {my: GAP}
  return <Box sx={sx}>
    <Alert {...rest}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </Alert>
  </Box>
}

export function Stack2(props: StackProps) {
  const {children, ...rest} = props
  return <Stack
    direction='column'
    spacing={GAP}
    {...rest}
  >{children}</Stack>
}
