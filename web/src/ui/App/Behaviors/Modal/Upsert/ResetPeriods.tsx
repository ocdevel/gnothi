import {UpsertProps, WithHelp} from "./Utils.tsx";
import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export function ResetPeriods(props: UpsertProps) {
  return <Box>
    <Days {...props} />
  </Box>
}

export function Days({field, form, isNew}: UpsertProps) {
  const days = <Box>
    <Typography>Days of week</Typography>
    <ButtonGroup aria-label="days of the week">
      <Button>M</Button>
      <Button>T</Button>
      <Button>W</Button>
      <Button>Th</Button>
      <Button>F</Button>
      <Button>S</Button>
      <Button>Su</Button>
    </ButtonGroup>
  </Box>
  const help = <Typography>On which days of the week should this behavior be due (determines if points are applied, and if the field should reset.)</Typography>
  return <WithHelp field={days} help={help} helpTitle="Days of week" />
}