import {UpsertProps, WithHelp} from "./Utils.tsx";
import Typography from "@mui/material/Typography";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";

const trackingHelp = <>
  <Typography><code>Analyze</code>: your behavior will be used in analysis against other behaviors. This is the real magic of behaviors; Gnothi can determine correlation between behaviors, to help you make informed decisions about your day-to-day. Eg, alcohol relates to sleep relates to mood. Very soon, a feature called DoWhy will be implemented for causal inference, which equates to "alcohol CAUSES poor sleep CAUSES bad mood." When this is implemented, Gnothi can make actual recommendations. It is encouraged to <strong>disable</strong> <code>analyze</code> if you're not interested in this behavior's impact on the grand scheme. Gnothi does work better with fewer behaviors - it's easier to home in. Esepcially when the number of behaviors outweighs the number of days tracked. So enable this liberally; but do disable liberally behaviors which aren't of interest for analysis.</Typography>
  <hr/>
  <Typography><code>Score</code>: your behavior will be counted as "good" or "bad". This is the core of the rewards-based habit-tracking system. You gain points towards rewards by doing "good" things (like exercising, reading, and pomodoros); and lose points by doing "bad" things (like drinking alcohol, smoking cigarettes, and punching people). Enable this if your behavior could be considered a <code>habit</code>, <code>daily</code>, <code>todo</code>, or <code>reward</code>. Likely you'll have selected one of those from the templates anyway,this is here for advanced mix-and-matching.</Typography>
</>
export function TrackingType({field, form, isNew}: UpsertProps) {

  return <WithHelp
    field={<ButtonGroup aria-label="tracking type">
      <Button>Analyze</Button>
      <Button>Score</Button>
    </ButtonGroup>}
    help={trackingHelp}
    helpTitle="Tracking Type"
  />
}