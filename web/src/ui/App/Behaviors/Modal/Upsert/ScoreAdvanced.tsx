import {UpsertProps, WithHelp} from "./Utils.tsx";
import {Checkbox2} from "../../../../Components/Form.tsx";
import Typography from "@mui/material/Typography";
import {useMemo} from "react";


export function ScoreAdvanced({form, field}: UpsertProps) {
  const [score_enabled] = form.watch(["score_enabled"])

  const help = useMemo(() => <Typography>Is "up" good (as in push-ups, glasses of water, etc)? Uncheck if "down" is good.</Typography>, [])

  if (!score_enabled) {return null}
  return <WithHelp
    field={<Checkbox2 form={form} name="score_up_good" label="Higher is better" />}
    help={help}
  />
}