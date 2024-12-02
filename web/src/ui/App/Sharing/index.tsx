import DialogContent from "@mui/material/DialogContent";
import {FullScreenDialog} from "../../Components/Dialog";
import Tabs from "../../Components/Tabs";
import {useCallback, useEffect} from "react";
import {CTA} from "../../Components/AppBar";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../data/store";
import Outbound from './Outbound'
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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
    send('shares_egress_list_request', {})
  }, [])

  const ctas: CTA[] = [{
    name: "New Share",
    onClick: clickNew,
  }]

  const renderOutbound = useCallback(() => <Outbound />, [])
  const renderInfo = useCallback(() => (
    <Box sx={{p: 2}}>
      <Typography variant="h6" gutterBottom>About Sharing in Gnothi</Typography>
      
      <Typography variant="subtitle1" gutterBottom>What is Sharing?</Typography>
      <Typography paragraph>
        Sharing in Gnothi allows you to selectively share parts of your journal and profile with other users. You can create multiple shares with different permissions for the same user, and Gnothi will automatically merge these shares to give them the maximum allowed access.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>How Sharing Works</Typography>
      <Typography paragraph>
        • You can share specific profile fields (email, name, bio, etc) and journal tags with other users
        • Users you share with will only see the information you explicitly allow
        • If you create multiple shares for the same user, they'll get the most permissive access from all shares
        • Shares can be to individual users or groups
        • Users must accept your share request before they can see your information
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Privacy & Control</Typography>
      <Typography paragraph>
        • You maintain full control over what others can see
        • You can modify or revoke shares at any time
        • The recipient will only see entries from the tags you've shared
        • Profile fields are individually controlled (email, username, birthday, etc)
        • Recipients can't reshare your information with others
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Managing Shares</Typography>
      <Typography paragraph>
        • Create new shares using the "New Share" button
        • View and manage existing shares in the "Outbound" tab
        • See users who are sharing with you in the sidebar under "Community"
        • Each share can have different permissions, even for the same user
      </Typography>
    </Box>
  ), [])

  function renderContent() {
    return <Tabs
      defaultTab={view.tab || "egress"}
      tabs={[
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
