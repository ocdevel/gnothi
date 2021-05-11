import Alert from "@material-ui/core/Alert";
import AlertTitle from "@material-ui/core/AlertTitle";
import Box from "@material-ui/core/Box";
import Stack from "@material-ui/core/Stack";

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
