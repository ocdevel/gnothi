import {ShareFeature, ShareProfileField} from "../../../../../../../schemas/shares.ts";
import React, {useCallback, useState} from "react";
import {FaChevronDown, FaChevronRight, FaRegQuestionCircle} from "react-icons/fa";
import _ from "lodash";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormHelperText from "@mui/material/FormHelperText";
import {AiOutlineWarning} from "react-icons/ai";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import {useStore} from "../../../../../data/store";
import {Link} from "react-router-dom";
import {useShallow} from "zustand/react/shallow";

// Fix the below line. `key` should be in `shareProfileFields`, which is an array of strings.

export const profileFields: {[key in ShareProfileField]: any} = {
  username: {
    label: "Username",
    help: "Recommended to enable this at a minimum. Unless you're sharing with a group and want to remain anonymous."
  },
  email: {
    label: "Email",
    help: "Share this only with people and groups you trust."
  },
  first_name: {
    label: "First Name",
    help: "Pretty harmless, if you enable username and first_name only."
  },
  last_name: {
    label: "Last Name",
    help: "Share this only with people and groups you trust."
  },
  bio: {
    label: "Bio",
    help: "Many can find this useful to share."
  },
  people: {
    label: "People",
    help: "Your list of people acts as something of a dictionary look-up for those with whom you share. If you journaled about Jack, they might want to look up who he is. Further, these people factor into AI - especially for question-answering."
  },
  gender: {
    label: "Gender",
    help: "If it's important for you others know your preferred gender / pronouns."
  },
  orientation: {
    label: "Orientation",
    help: "If it's important for you others know your orientation."
  },
  birthday: {
    label: "Birthday",
    help: "Kinda pointless to share this. But hey, your call!"
  },
  timezone: {
    label: "Timezone",
    help: "If you want others to know where you're located (generally). Maybe so they what hours you're around to respond?"
  },
}

export const featureMap: {[key in ShareFeature]: any} = {
  profile: {
    label: 'Profile & People',
    help: "This allows users to view your profile info. Expand for more fine-grained control.",
    extraHelp: <>You'll need to add these profile fields manually under <Link to='/profile'>Profile.</Link>. If you checked a box, but that field isn't in your profile, Gnothi will use fall-backs where possible.</>
  },
  fields: {
    label: "Behavior Tracking",
    help: "Users can view your tracked behaviors and charts."
  },
  // books: {
  //   label:'Books',
  //   help: "Users can view your AI-recommended books, your bookshelves (liked, disliked, etc), and can recommend books to you (goes to 'Recommended' shelf)."
  // },
}

interface ShareCheck {
  k: ShareProfileField | ShareFeature
  profile: boolean
}
export function Permission({k, profile=false}: ShareCheck) {
  const [
    myProfile,
    share
  ] = useStore(useShallow(s => [
    s.user.me,
    s.sharing.form.share
  ]))
  const setShare = useStore(s => s.sharing.form.setShare)
  const [help, setHelp] = useState(!!profile)
  const [showMore, setShowMore] = useState(false)

  const v = profile ? profileFields[k] : featureMap[k]
  const label = profile ? v.label :
    <>{v.label} <FaRegQuestionCircle onClick={toggle} /></>

  function toggle(e: React.SyntheticEvent) {
    if (e) {e.preventDefault()}
    setHelp(!help)
  }

  function check(e: React.ChangeEvent<HTMLInputElement>) {
    if (k !== 'profile') {
      return setShare({...share, [k]: e.target.checked})
    }
    if (share[k]) {
      return setShare({
        ...share,
        ..._.mapValues(profileFields, () => false),
        profile: false
      })
    }
    setShare({
      ...share,
      ..._.mapValues(profileFields, () => true),
      profile: true
    })
  }

  return <div>
    <FormControl>
      <FormControlLabel
        control={
          <Checkbox
            onChange={check}
            checked={share[k] ?? false}
            disabled={profile && !share.profile}
          />
        }
        label={label}
      />
      {help && <FormHelperText>{v.help}</FormHelperText>}
      {profile && !myProfile[k] && <FormHelperText>
        <AiOutlineWarning /> You haven't set this field on your profile page.
      </FormHelperText>}
    </FormControl>
    {k === 'profile' && <div>
     <Typography
       variant='body2'
       component="div"
       marginLeft={3.5}
       onClick={() => setShowMore(!showMore)}
       sx={{cursor: "pointer", display: "flex", alignItems: "center"}}
     >
      {showMore
        ? <>
          <FaChevronDown />
          <span>Hide fine-grained options</span>
        </>
        : <>
          <FaChevronRight />
          <span>Show fine-grained options</span>
        </>}
     </Typography>
    </div>}
    {k === 'profile' && showMore && <Box sx={{ml:2}}>
      {_.map(profileFields, (v, k) => (
        <Permission key={k} k={k} profile={true} />
      ))}
      <Divider />
    </Box>}
  </div>
}