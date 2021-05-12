import Alert from "@material-ui/core/Alert";
import AlertTitle from "@material-ui/core/AlertTitle";
import Box from "@material-ui/core/Box";
import Stack from "@material-ui/core/Stack";
import Typography from "@material-ui/core/Typography";
import * as React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";

const GAP = 2

export function Alert2(props) {
  const {title, children, noTop, ...rest} = props
  const sx = noTop ? {mb: GAP} : {my: GAP}
  return <Box sx={sx}>
    <Alert {...rest}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </Alert>
  </Box>
}

export function Stack2(props) {
  const {children, ...rest} = props
  return <Stack
    direction='column'
    spacing={GAP}
    {...rest}
  >{children}</Stack>
}

export function ToolbarHeader(props) {
  const {title, buttons, ...rest} = props
  return <Grid
    container
    justifyContent='space-between'
    alignItems='center'
  >
    <Grid item>
      <Typography variant="h6" noWrap component="div" {...rest}>
        {title}
      </Typography>
    </Grid>
    <Grid item>
      <Stack2 direction='row'>{buttons}</Stack2>
    </Grid>
  </Grid>
}
