import {Stack2} from "./Misc.tsx";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import {shallow} from "zustand/shallow";
import {useStore} from "../../data/store";
import {ButtonProps} from '@mui/material/Button'
import {BasicDialog} from "./Dialog.tsx";
import CardContent from "@mui/material/CardContent";

interface BtnTryGenerative {
  tryLabel: string
  premiumLabel: string | null
  submit: any
  btnProps?: ButtonProps
}
export default function BtnTryGenerative({
  tryLabel,
  premiumLabel,
  submit,
  btnProps={},
}: BtnTryGenerative) {
  const [me, creditActive, creditActivate, setPremium] = useStore(s => [
    s.user?.me,
    s.creditActive,
    s.creditActivate,
    s.modals.setPremium
  ], shallow)

  const [showHelp, setShowHelp] = React.useState<boolean>(false)

  function handleSubmit() {
    creditActivate()
    submit()
  }

  const btnProps_: ButtonProps = {variant: "contained", color: "primary", ...btnProps}

  if (me?.premium || creditActive) {
    if (!premiumLabel) { return null }
    return <Button
      onClick={submit}
      {...btnProps_}
    >
      {premiumLabel}
    </Button>
  }

  if (me?.credits < 1 && !me?.premium) {
    return <Button
      onClick={() => setPremium(true)}
      {...btnProps_}
    >
      {tryLabel} (0 credits)
    </Button>
  }

  return <Stack2 direction='column' alignItems="center">
    <Button
      onClick={handleSubmit}
      {...btnProps_}
    >
      {tryLabel} (1 credit)
    </Button>
    <Stack2 direction='row'>
      <Typography variant='body2'>{me?.credits ?? 10} / 10 Credits{creditActive ? " (credit currently active)" : ""}</Typography>
      <Typography
        variant="caption"
        sx={{textDecoration: "underline", cursor: "pointer"}}
        onClick={() => setShowHelp(true)}
      >What's this?</Typography>
    </Stack2>
    <BasicDialog open={showHelp} onClose={() => setShowHelp(false)} size={'sm'}>
      <CardContent>
        <Typography>You can use 10 credits to test-drive the Generative Plan. When you activate 1 credit, it is active for 5 minutes across the site and you can use all generative features. These features include Summary & Themes (per entry submission AND the list-view), Prompt (chat), and next-entry suggestion. When the timer runs out, you'll need to use another credit to activate Generative Mode, or upgrade to the Generative Plan.</Typography>
      </CardContent>
    </BasicDialog>
  </Stack2>
}