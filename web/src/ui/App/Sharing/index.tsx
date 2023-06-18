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
    send,
    shares,
    view,
    setView
  ] = useStore(s => [
    s.send,
    s.res.shares_egress_list_response,
    s.sharing.view,
    s.sharing.setView
  ], shallow)

  const comingSoon = true

  useEffect(() => {
    send('shares_egress_list_request', {})
  }, [])

  const clickNew = useCallback(() => {
    setView({tab: "outbound", outbound: "new", sid: null})
  }, [])
  const close = useCallback(() => {
    setView({tab: null})
  }, [])

  const ctas: CTA[] = comingSoon ? [] : [{
    name: "New Share",
    onClick: clickNew,
  }]

  const renderInbound = useCallback(() => <Inbound />, [])
  const renderOutbound = useCallback(() => <Outbound />, [])
  const renderInfo = useCallback(() => <div>Info goes here</div>, [])

  function renderContent() {
    if (comingSoon) {
      return <Typography>This feature is currently being migrated from the old site, coming back soon</Typography>
    }
    return <Tabs
      defaultTab={view.tab || "inbound"}
      tabs={[
        {label: "Inbound", value: "inbound", render: renderInbound},
        {label: "Outbound", value: "outbound", render: renderOutbound},
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
