import {UpsertProps, WithHelp} from "./Utils.tsx";
import Typography from "@mui/material/Typography";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import TrackingTypeHelp from './Help/TrackingType.mdx'
import {useMemo} from "react";

export function TrackingType({field, form, isNew}: UpsertProps) {
  const [analyze_enabled, score_enabled] = form.watch(["analyze_enabled", "score_enabled"])

  const help = useMemo(() => <TrackingTypeHelp />, [])

  const buttons = <ButtonGroup aria-label="tracking type">
    <Button
      onClick={() => form.setValue('analyze_enabled', !analyze_enabled)}
      variant={analyze_enabled ? 'contained' : 'outlined'}
    >
      Analyze
    </Button>
    <Button
      onClick={() => form.setValue('score_enabled', !score_enabled)}
      variant={score_enabled ? 'contained' : 'outlined'}
    >
      Score
    </Button>
  </ButtonGroup>


  return <WithHelp
    field={buttons}
    help={help}
    fieldTitle="Tracking Type"
  />
}