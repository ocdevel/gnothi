import {BasicDialog, FullScreenDialog} from "../../Components/Dialog.tsx";
import DialogContent from "@mui/material/DialogContent";
import {useStore} from "../../../data/store";
import {shallow} from "zustand/shallow";
import {useCallback, useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PlanComparison, {buttonDefaults} from '../../Static/Splash/Features/PlanComparison.tsx'
import {Loading} from "../../Components/Routing.tsx";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Banner from "../../Components/Banner"
import * as dayjs from 'dayjs'
import FeatureLayout from '../../Static/Splash/Features/FeatureLayout'

const PAYMENT_LINK = "https://buy.stripe.com/test_dR68wJ2kj6lc4es3cc"

export default function PremiumModal() {
  const [
    me,
    premiumModal,
    setPremiumModal,
    stripe_list_response,
    send
  ] = useStore(s => [
    s.user?.me, 
    s.modals.premium,
    s.modals.setPremium,
    s.res.stripe_list_response?.first,
    s.send
  ], shallow)
  const [canceling, setCanceling] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  async function fetchStripeDetails() {
    if (!(me?.payment_id && premiumModal)) {return}
    send("stripe_list_request", {})
  }

  useEffect(() => {
    fetchStripeDetails()
  }, [me?.payment_id, premiumModal])


  const close = useCallback(() => {setPremiumModal(false)}, [])
  async function cancelStripe() {
    // show confirmation alert, get yes response first
    if (!confirm("Are you sure you want to cancel your premium subscription?")) {return}
    // setCanceling(true)
    send("stripe_cancel_request", {})
  }

  function premiumActiveFooter() {
    const s = stripe_list_response
    if (!s) {return null}
    const fmt = (x) => dayjs.unix(x).format('YYYY-MM-DD')
    return <Alert severity="success" sx={{width:"100%"}}>
      <Stack spacing={1}>
        <Typography>Premium is Active</Typography>
        <Typography>Amount: ${parseFloat(s.plan.amount) / 100}</Typography>
        <Typography>Created: {fmt(s.created)}</Typography>
        <Typography>Last Charge: {fmt(s.current_period_start)}</Typography>
        <Typography>Next Charge: {fmt(s.current_period_end)}</Typography>
      </Stack>
    </Alert>
  }

  function premiumInactiveFooter() {
    return <Button
      {...buttonDefaults}
      disabled={!me}
      onClick={() => setShowDisclaimer(true)}
    >Upgrade</Button>
  }

  function basicActiveFooter() {
    return null
  }

  function basicInactiveFooter() {
    return <Button
      {...buttonDefaults}
      onClick={cancelStripe}
      disabled={canceling}
    >
      Downgrade to Basic
    </Button>
  }

  function clickLastUpgrade() {
    if (!me) {return}
    setShowDisclaimer(false)
    // use javascript to redirect user to the payment link, target=_blank
    const link = `${PAYMENT_LINK}?client_reference_id=${me.id}`
    window.open(link, "_blank")
  }

  return <>
    <FullScreenDialog title={"Premium"} open={premiumModal} onClose={close}>
      <DialogContent>
        <Banner />
        <PlanComparison
          premiumFooter={me?.premium ? premiumActiveFooter : premiumInactiveFooter}
          basicFooter={me?.premium ? basicInactiveFooter : basicActiveFooter}
        />
        {/*<FeatureLayout />*/}
      </DialogContent>
    </FullScreenDialog>
    <BasicDialog
      open={showDisclaimer && !me?.premium}
      onClose={() => setShowDisclaimer(false)}
      size={"sm"}
    >
      <DialogContent sx={{padding: 5}}>
        <Typography variant="h5" gutterBottom>Heading</Typography>
        <Typography pb={5}>Insert information about OpenAI <a href="https://openai.com/policies/privacy-policy" target="_blank">OpenAI's privacy policy</a></Typography>
        <Button
          {...buttonDefaults}
          size="large"
          onClick={clickLastUpgrade}
        >
          Upgrade
        </Button>
      </DialogContent>
    </BasicDialog>
  </>
}