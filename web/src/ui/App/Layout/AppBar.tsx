import {useLocation} from "react-router-dom";
import {shallow} from "zustand/shallow";
import {useCallback} from "react";
import AppBar, {CTA, Link} from "../../Components/AppBar";
import * as React from "react";
import {useStore} from "../../../data/store";
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';

export default function AppBar_() {
  const location = useLocation()
  const [
    setShareView,
    setEntryModal,
    toggleSidebar
  ] = useStore(s => [
    s.sharing.setView,
    s.modals.setEntry,
    s.toggleSidebar
  ], shallow)

  const clickSharing = useCallback(() => {
    setShareView({tab: "inbound", outbound: "new", sid: null})
  }, [])
  const clickEntry = useCallback(() => {
    setEntryModal({mode: "new"})
  }, [])

  const links: Link[] = []  

  const ctas: CTA[] =
    location.pathname.startsWith("/j") ? [{
      name: "New Entry",
      onClick: clickEntry,
    }]
    : []

  const clearBottom = !['/privacy', '/terms', '/disclaimer'].includes(location.pathname)

  const leftContent = (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        color="inherit"
        aria-label="toggle sidebar"
        onClick={toggleSidebar}
        edge="start"
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>
    </Box>
  )

  return <AppBar
    clearBottom={clearBottom}
    links={links}
    ctas={ctas}
    leftContent={leftContent}
  />
  // return <>
  //   <Routes>
  //     <Route path='/groups/*' element={<S><GroupsToolbar /></S>} />
  //     <Route path='/groups/:gid' element={<S><GroupToolbar /></S>} />
  //   </Routes>
  // </>
}
