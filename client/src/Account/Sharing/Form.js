import {Link} from "react-router-dom";
import * as yup from "yup";
import _ from "lodash";
import React, {useEffect, useRef, useState} from "react";
import {FaChevronDown, FaChevronRight, FaRegQuestionCircle} from "react-icons/fa";
import {useStoreActions, useStoreState} from "easy-peasy";
import Groups from "./Groups";
import Users from './Users'
import Tags from "../../Tags";
import {AiOutlineWarning} from "react-icons/ai";
import {trueObj} from "../../Helpers/utils";
import {EE} from '../../redux/ws'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Grid from '@material-ui/core/Grid'
import Checkbox from '@material-ui/core/Checkbox'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Box from '@material-ui/core/Box'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'

const profile_fields = {
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

const feature_map = {
  profile: {
    label: 'Profile & People',
    help: "Users can view your profile fields. Expand this for more fine-grained control.",
    extraHelp: <>You'll need to add these profile fields manually under <Link to='/profile'>Profile.</Link>. If you checked a box, but that field isn't in your profile, Gnothi will use fall-backs where possible.</>
  },
  fields: {
    label: "Fields & Charts",
    help: "Users can view your fields & field-entries, history, and charts."
  },
  books: {
    label:'Books',
    help: "Users can view your AI-recommended books, your bookshelves (liked, disliked, etc), and can recommend books to you (goes to 'Recommended' shelf)."
  },
}

const shareSchema = yup.object().shape({
  fields: yup.boolean(),
  books: yup.boolean(),
  ..._.mapValues(profile_fields, () => yup.boolean())
})

function ShareCheck({k, form, setForm, profile=false}) {
  const myProfile = useStoreState(s => s.ws.data['users/profile/get'])
  const [help, setHelp] = useState(!!profile)
  const [showMore, setShowMore] = useState(false)

  const v = profile ? profile_fields[k] : feature_map[k]
  const label = profile ? v.label :
    <>{v.label} <FaRegQuestionCircle onClick={toggle} /></>

  function toggle(e) {
    if (e) {e.preventDefault()}
    setHelp(!help)
  }

  function check(e) {
    if (k !== 'profile') {
      return setForm({...form, [k]: e.target.checked})
    }
    if (form[k]) {
      return setForm({
        ...form,
        ..._.mapValues(profile_fields, () => false),
        profile: false
      })
    }
    setForm({
      ...form,
      username: true,
      bio: true,
      profile: true
    })
  }

  return <div>
    <FormControl>
      <FormControlLabel
        control={
          <Checkbox
            onChange={check}
            checked={form[k]}
            disabled={profile && !form.profile}
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
      <div
        className='text-muted small cursor-pointer'
        onClick={() => setShowMore(!showMore)}
      >
        {showMore
          ? <><FaChevronDown /> Hide fine-grained options</>
          : <><FaChevronRight /> Show fine-grained options</>}
      </div>
    </div>}
    {k === 'profile' && showMore && <Box sx={{ml:2}}>
      {_.map(profile_fields, (v, k) => (
        <ShareCheck key={k} k={k} form={form} setForm={setForm} profile={true} />
      ))}
      <Divider />
    </Box>}
  </div>
}

export default function ShareForm({s={}}) {
  const emit = useStoreActions(a => a.ws.emit)
  const postRes = useStoreState(s => s.ws.res['shares/shares/post'])
  const sharePage = useStoreState(s => s.user.sharePage)
  const setSharePage = useStoreActions(a => a.user.setSharePage)
  const [entriesHelp, setEntriesHelp] = useState(false)
  const [share, setShare] = useState(s.share || {})
  const [tags, setTags] = useState(trueObj(s?.tags) || {})
  const [users, setUsers] = useState(trueObj(s?.users) || {})
  const [groups, setGroups] = useState(
    share?.id ? trueObj(s.groups)
    : sharePage.group ? {[sharePage.group]: true}
    : {}
  )

  const id = share?.id

  useEffect(() => {
    EE.on("wsResponse", onResponse)
    return () => EE.off("wsResponse", onResponse)
  }, [])

  function onResponse(res) {
    if (!~['shares/shares/post', 'shares/share/delete'].indexOf(res.action)) {return}
    if (res.code === 200) {
      setSharePage({list: true})
    }
  }

  const submit = async e => {
    e.preventDefault()
    const body = {
      share,
      tags,
      users,
      groups
    }
    emit(['shares/shares/post', body])
  }

  function deleteShare () {
    emit(['shares/share/delete', {id}])
  }

  return <Card>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography color='text.secondary' textAlign='center'>Share</Typography>
          {_.map(feature_map, (v, k) => (
            <ShareCheck key={k} v={v} k={k} form={share} setForm={setShare} />
          ))}

          <div>Entries <FaRegQuestionCircle onClick={() => setEntriesHelp(!entriesHelp)}/></div>
          {entriesHelp && <div className='small text-muted'>
            User can view entries with these tags, and can use features involving these entries:
            <ul>
              <li>Summaries</li>
              <li>Question-answering</li>
              <li>Themes</li>
            </ul>
            Example use: sharing darker entries with a therapist, and lighter entries (eg travel, dreams) with friends.
          </div>}
          <Tags
            selected={tags}
            setSelected={setTags}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography color='text.secondary' textAlign='center'>With</Typography>
          <Grid container spacing={2} direction='column'>
            <Grid item><Users users={users} setUsers={setUsers} /></Grid>
            <Grid item><Groups groups={groups} setGroups={setGroups} /></Grid>
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
    <CardActions>
      <Button
        onClick={submit}
        variant='contained'
        color="primary"
        disabled={postRes?.submitting}
      >
        {id ? 'Save' : 'Submit'}
      </Button>&nbsp;
      {id && <Button
        color="secondary"
        size="small"
        onClick={deleteShare}
      >Delete</Button>}
      <Button
        size='small'
        onClick={() => setSharePage({list: true})}
      >Cancel</Button>
    </CardActions>
  </Card>
}
