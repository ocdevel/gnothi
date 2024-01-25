import DialogContent from "@mui/material/DialogContent";
import {FullScreenDialog} from "../../Components/Dialog";
import Tabs from "../../Components/Tabs";
import {useCallback, useEffect} from "react";
import {CTA} from "../../Components/AppBar";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../data/store";
import Inbound from "./Inbound";
import Outbound from './Outbound'
import Typography from "@mui/material/Typography";

export default function Sharing() {
  const [
    shares,
    view,
  ] = useStore(s => [
    s.res.shares_egress_list_response,
    s.sharing.view,
  ], shallow)
  const [
    send,
    clickNew,
    close,
  ] = useStore(useCallback(s => [
    s.send,
    () => s.sharing.setView({tab: "egress", egress: "new", sid: null}),
    () => s.sharing.setView({tab: null})
  ], []))

  useEffect(() => {
    // TODO Since modal is mounted anyway, this is kicked off (expensive on server). Have clever logic to only
    // trigger this once first time modal is opened
    send('shares_egress_list_request', {})
  }, [])

  const ctas: CTA[] = [{
    name: "New Share",
    onClick: clickNew,
  }]

  const renderInbound = useCallback(() => <Inbound />, [])
  const renderOutbound = useCallback(() => <Outbound />, [])
  const renderInfo = useCallback(() => <div>Info goes here</div>, [])

  function renderContent() {
    return <Tabs
      defaultTab={view.tab || "egress"}
      tabs={[
        {label: "Inbound", value: "ingress", render: renderInbound},
        {label: "Outbound", value: "egress", render: renderOutbound},
        {label: "Info", value: "info", render: renderInfo},
      ]}
    />
  }

  return <FullScreenDialog
      className="sharing modal"
      open={view.tab !== null}
      onClose={close}
      title='Sharing'
      ctas={ctas}
    >
      <DialogContent>
        {renderContent()}
      </DialogContent>
  </FullScreenDialog>
}
