import {useStore} from "../../../../data/store";
import ProfileModal from "../../Account/Profile";
import Badge from "@mui/material/Badge";
import _ from "lodash";
import {RiSpyLine} from "react-icons/ri";
import {FaUser} from "react-icons/fa";
import React from "react";
import {NestedList, ListItem} from "./Utils";

export function ProfileLink({as, asUser}) {
  const profile = useStore(s => s.profile)
  const setProfile = useStore(a => a.setProfile)
  function toggle() {
    if (profile) {
      setProfile(null)
    } else {
      setProfile(true) // TODO use profile object
    }
  }
  const canProfile = !as || (asUser?.share?.profile)
  return <>
    {profile && <ProfileModal close={toggle} />}
    {canProfile && <ListItem onClick={toggle} primary="Profile" nested={true}/>}
  </>
}



export function Account() {
  const logout = useStore(actions => actions.logout)
  const user = useStore(s => s.user)

  if (!user?.me) {return null}
  const {as, viewer, me} = user

  return <>
    <NestedList
      icon={as ? <RiSpyLine /> : <FaUser />}
      primary='Account'
    >

      <ProfileLink as={as} asUser={viewer}/>

      <ListItem
        onClick={() => logout()}
        primary='Logout'
        nested={true}
      />
    </NestedList>
  </>
}
