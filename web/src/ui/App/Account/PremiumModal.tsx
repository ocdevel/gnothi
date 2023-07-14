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
import {STAGE} from '../../../utils/config'
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import _ from "lodash";

const PAYMENT_LINK = STAGE === "prod" ? "https://buy.stripe.com/fZe02UdpT5Xd6yI6op"
  : "https://buy.stripe.com/test_dR68wJ2kj6lc4es3cc"


const fmt = (x: any) => dayjs.unix(x).format('YYYY-MM-DD')

export function SubscriptionDetails() {
  const stripe_list_response = useStore(s => s.res.stripe_list_response?.first)
  const s = stripe_list_response
  if (!s) {return null}
  const canceled = s.status === "canceled"
  return <TableContainer
    component={Paper}
    sx={{mb:2}}
  >
      <Table sx={{width: "100%"}}>
        <TableBody>
          <TableRow
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <TableCell>Status</TableCell>
            <TableCell>{_.startCase(s.status)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Amount</TableCell>
            <TableCell>${parseFloat(s.plan.amount) / 100}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Created</TableCell>
            <TableCell>{fmt(s.created)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Last Charge</TableCell>
            <TableCell>{fmt(s.current_period_start)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{canceled ? "Cancels On" : "Next Charge"}</TableCell>
            <TableCell>{fmt(s.current_period_end)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
}

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
  // git-blame for showDisclaimer()

  const canceled = stripe_list_response?.status === "canceled"

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
    window.location.href = "/"
  }

  function premiumActiveFooter() {
    return <SubscriptionDetails />
  }

  function premiumInactiveFooter() {
    if (canceled) {return null}
    return <>
      <Button
        className="btn-upgrade"
        fullWidth
        {...buttonDefaults}
        disabled={!me}
        target="_blank"
        href={`${PAYMENT_LINK}?client_reference_id=${me?.id}`}
      >
        Try it Free for a Week
      </Button>
      <div>
        <Typography variant="body2" textAlign='center' px={2}>Upgrade enables GPT. See OpenAI's <a href="https://openai.com/policies/privacy-policy" target="_blank">privacy policy</a> and <a href="https://openai.com/policies/terms-of-use" target="_blank">terms of use</a></Typography>
      </div>
    </>
  }

  function basicActiveFooter() {
    return null
  }

  function basicInactiveFooter() {
    if (canceled) {return null}
    return <Button
      {...buttonDefaults}
      onClick={cancelStripe}
      disabled={canceling}
    >
      Downgrade to Basic
    </Button>
  }

  return <>
    <FullScreenDialog
      title="Plan Comparison"
      open={premiumModal}
      onClose={close}
      className="premium modal"
    >
      <DialogContent>
        <Banner />
        <PlanComparison
          premiumFooter={me?.premium ? premiumActiveFooter : premiumInactiveFooter}
          basicFooter={me?.premium ? basicInactiveFooter : basicActiveFooter}
        />
        {/*<FeatureLayout />*/}
      </DialogContent>
    </FullScreenDialog>
  </>
}
