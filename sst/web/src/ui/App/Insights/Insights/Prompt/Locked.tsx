import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import * as Link from "../../../../Components/Link.tsx"
import {useStore} from "../../../../../data/store"
import axios from "axios"
import {useCallback} from "react";
import {shallow} from "zustand/shallow";



export default function Locked() {
  const [me, setPremiumModal] = useStore(s => [
    s.user?.me,
    s.setPremiumModal
  ], shallow)
  if (!me?.id || me.premium) { return null }

  const openModal = useCallback(() => {setPremiumModal(true)}, [])

  return <Box>
    <Button
      variant="contained"
      color="primary"
      onClick={openModal}
      fullWidth
    >
      Upgrade to Premium
    </Button>
  </Box>
}
