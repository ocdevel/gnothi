import {useLocation} from "react-router-dom";
import shallow from "zustand/shallow";
import {useCallback} from "react";
import AppBar, {CTA, Link} from "../../Components/AppBar";
import * as React from "react";
import {useStore} from "../../../data/store";

export default function AppBar_() {
  const location = useLocation()
  const [
    setShareView,
    setEntryModal,
  ] = useStore(s => [
    s.sharing.setView,
    s.setEntryModal,
  ], shallow)

  const clickSharing = useCallback(() => {
    setShareView({tab: "inbound", outbound: "new", sid: null})
  }, [])
  const clickEntry = useCallback(() => {
    setEntryModal({mode: "new"})
  }, [])

  const links: Link[] = [
    {name: "Journal", to: "/j", className: "btn-journal"},
    {name: "Sharing", onClick: clickSharing, className: "btn-sharing"},
    // {name: "Groups", to: "/groups", className: "btn-groups},
    // {name: "Resources", to: "/", className: "btn-resources"}
  ]

  const ctas: CTA[] =
    location.pathname.startsWith("/j") ? [{
      name: "New Entry",
      onClick: clickEntry,
    }]
    : []

  return <AppBar
    clearBottom={true}
    links={links}
    ctas={ctas}
  />
  // return <>
  //   <Routes>
  //     <Route path='/groups/*' element={<S><GroupsToolbar /></S>} />
  //     <Route path='/groups/:gid' element={<S><GroupToolbar /></S>} />
  //   </Routes>
  // </>
}
