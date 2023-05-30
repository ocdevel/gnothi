import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import * as Link from "../../../../Components/Link.tsx"
import {useStore} from "../../../../../data/store"
import axios from "axios"

const PAYMENT_LINK = "https://buy.stripe.com/test_dR68wJ2kj6lc4es3cc"

export default function Locked() {
  const me = useStore(s => s.user?.me)
  if (!me?.id || me.premium) { return null }
  const paymentLink = `${PAYMENT_LINK}?client_reference_id=${me.id}`

  async function test() {
    await axios.post(import.meta.env.VITE_API_HTTP  + "/stripe/webhook", {})
  }

  return <Box>
    <Typography>This is a premium feature</Typography>
    <Button variant="contained" color="primary" href={paymentLink} target="_blank">
      Upgrade
    </Button>

    <Button onClick={test}>
      test
    </Button>
  </Box>
}
