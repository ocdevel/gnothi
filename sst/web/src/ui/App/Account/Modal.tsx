import {FullScreenDialog} from "../../Components/Dialog.tsx";
import DialogContent from "@mui/material/DialogContent";
import {useStore} from "../../../data/store";
import {shallow} from "zustand/shallow";
import {useCallback, useEffect} from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function Modal() {
  const [
    me,
    accountModal,
    setAccountModal,
    send
  ] = useStore(s => [
    s.user?.me,
    s.accountModal,
    s.setAccountModal,
    s.send
  ], shallow)

  // useEffect(() => {
  //   if (!me?.stripe_id) {return}
  //
  // }, [me?.stripe_id])


  const close = useCallback(() => {setAccountModal(false)}, [])
  async function cancelStripe() {
    send("stripe_cancel_request", {})
  }

  function renderFree(){
    return null
  }

  function renderPremium() {
    return <Button onClick={cancelStripe}>Cancel Premium</Button>
  }

  return <FullScreenDialog title={"Account"} open={accountModal} onClose={close}>
    <DialogContent>
      {me?.premium ? renderPremium() : renderFree()}
    </DialogContent>
  </FullScreenDialog>
}
