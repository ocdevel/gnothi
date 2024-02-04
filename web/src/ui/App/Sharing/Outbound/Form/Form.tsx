import {Link} from "react-router-dom";
import z from "zod"
import _ from "lodash";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {FaChevronDown, FaChevronRight, FaRegQuestionCircle} from "react-icons/fa";
import {useStore} from "@gnothi/web/src/data/store"
import Groups from "./Groups";
import Users from './Users'
import Tags from "./Tags"
import {AiOutlineWarning} from "react-icons/ai";
import {trueObj} from "@gnothi/web/src/utils/utils";
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormHelperText from '@mui/material/FormHelperText'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import {shallow} from "zustand/shallow";
import * as S from '@gnothi/schemas'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
  shares_post_request,
  ShareFeature,
  ShareProfileField,
  shares_egress_list_response
} from "../../../../../../../schemas/shares.ts";
import {useShallow} from "zustand/react/shallow";
import {Permission, featureMap, profileFields} from "./Permissions.tsx";


export default function ShareForm() {
  const view = useStore(s => s.sharing.view)
  const sid = view.sid
  const share = useStore(s => sid && s.res.shares_egress_list_response?.hash?.[sid] || undefined)
  const props = share ? {s: share, isNew: false} : {s: undefined, isNew: true}
  return <ShareForm_ {...props} />
}


type ShareForm_ = {
  s: shares_egress_list_response
  isNew: false
} | {
  s: undefined
  isNew: true
}
function ShareForm_({s, isNew}: ShareForm_) {
  const [
    view,
    postReq,
    deleteReq,
    postRes,
    deleteRes,
  ] = useStore(s => [
    s.sharing.view,
    s.req.shares_post_request,
    s.req.shares_delete_request,
    s.res.shares_post_response?.res,
    s.res.shares_delete_response?.res
  ], shallow)
  const [
    send,
    setView,
    clearEvents,
    cancel,
    reset,
    getForm
  ] = useStore(useCallback(s => [
    s.send,
    s.sharing.setView,
    s.clearEvents,
    () => s.sharing.setView({egress: null, sid: null}),
    s.sharing.form.reset,
    s.sharing.form.getForm,
  ], []))

  const id = s?.id

  // not used since we're using store, our setup is fairly complex
  // const form = useForm({
  //   resolver: zodResolver(shares_post_request),
  // })

  useEffect(() => {
    reset(s)
    // FIXME
    // const [groups, setGroups] = useState(
    //   share?.id ? trueObj(s.groups)
    //   : view.gid ? {[view.gid]: true}
    //   : {}
    // )
  }, [s])

  const [entriesHelp, setEntriesHelp] = useState(false)

  const postLoading = postReq && !postRes
  const deleteLoading = deleteReq && !deleteRes

  useEffect(() => {
    // FIXME ensure this is matching req/res (like s.id == deleteRes.id), so we don't redirect from delayed other
    if (deleteRes?.code === 200) {
      clearEvents(["shares_delete_response"])
      setView({tab: "egress", egress: "list"})
    }
  }, [deleteRes])

  useEffect(() => {
    // EE.on("wsResponse", onResponse)
    // return () => EE.off("wsResponse", onResponse)
    if (postRes?.code === 200) {
      clearEvents(["shares_post_response"])
      setView({tab: "egress", egress: "list"})
    }
  }, [postRes])

  const submit = async e => {
    e.preventDefault()
    send('shares_post_request', getForm())
  }

  function deleteShare () {
    send('shares_delete_request', {id})
  }

  return <Card
    sx={{
      height: '100%',
      // maxWidth: 800,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 3,
    }}>
    <CardContent>
      <Grid container direction='column'>

        <Grid item xs={12}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            textAlign='left'
          >
            Set up a new share
            {s?.id}
          </Typography>

          <Grid item>
            <Users />
          </Grid>
            <Grid item>
              <Groups />
        </Grid>


        <Grid item xs={12}>
          <Typography
            variant='body1'
            fontWeight={400}
            marginTop={4}
          >
            Which tagged entries would you like to share?
          </Typography>
          <Typography
            variant='body2'
            marginBottom={2}>
            You can create a new tag for this share by selecting “manage tags.”
          </Typography>
        {/*<div> <FaRegQuestionCircle onClick={() => setEntriesHelp(!entriesHelp)}/></div>*/}
        {/*{entriesHelp && <div className='small text-muted'>*/}
        {/*  User can view entries with these tags, and can use features involving these entries:*/}
        {/*  <ul>*/}
        {/*    <li>Summaries</li>*/}
        {/*    <li>Prompt (if they have premium)</li>*/}
        {/*    <li>Themes</li>*/}
        {/*</div>}*/}
        <Tags />
      </Grid>

      <Grid item xs={12}>
        <Typography
          variant='body1'
          fontWeight={400}
          marginTop={4}
        >
          What other information do you want to share?
        </Typography>
        <Typography
          variant='body2'
          marginBottom={1}
        >
          Leave unchecked if you’d prefer not to share any of these.
        </Typography>

        <Box
          marginLeft={2}>
          {_.map(featureMap, (v, k) => (
            <Permission key={k} v={v} k={k} />
          ))}
          </Box>
        </Grid>
        </Grid>
      </Grid>

    </CardContent>
    <CardActions
      sx={{alignItems: 'center', justifyContent: 'center', marginBottom: 2}}
    >
      <Button
        onClick={submit}
        variant='contained'
        color="primary"
        disabled={postLoading}
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
        onClick={cancel as any}
      >Cancel</Button>
    </CardActions>
  </Card>
  }


  // return <Card>
  //   <CardContent>
  //     <Grid container spacing={2}>
  //       <Grid item xs={12} md={6}>
  //         <Typography color='text.secondary' textAlign='center'>Share</Typography>
  //         {_.map(feature_map, (v, k) => (
  //           <ShareCheck key={k} v={v} k={k} form={share} setForm={setShare} />
  //         ))}
  //
  //         <div>Entries <FaRegQuestionCircle onClick={() => setEntriesHelp(!entriesHelp)}/></div>
  //         {entriesHelp && <div className='small text-muted'>
  //           User can view entries with these tags, and can use features involving these entries:
  //           <ul>
  //             <li>Summaries</li>
  //             <li>Question-answering</li>
  //             <li>Themes</li>
  //           </ul>
  //           Example use: sharing darker entries with a therapist, and lighter entries (eg travel, dreams) with friends.
  //         </div>}
  //         <Tags
  //           selected={tags}
  //           setSelected={setTags}
  //         />
  //       </Grid>
  //       <Grid item xs={12} md={6}>
  //         <Typography color='text.secondary' textAlign='center'>With</Typography>
  //         <Grid container spacing={2} direction='column'>
  //           <Grid item><Users users={users} setUsers={setUsers} /></Grid>
  //           <Grid item><Groups groups={groups} setGroups={setGroups} /></Grid>
  //         </Grid>
  //       </Grid>
  //     </Grid>
  //   </CardContent>
  //   <CardActions>
  //     <Button
  //       onClick={submit}
  //       variant='contained'
  //       color="primary"
  //       disabled={postRes?.submitting}
  //     >
  //       {id ? 'Save' : 'Submit'}
  //     </Button>&nbsp;
  //     {id && <Button
  //       color="secondary"
  //       size="small"
  //       onClick={deleteShare}
  //     >Delete</Button>}
  //     <Button
  //       size='small'
  //       onClick={() => setSharePage({list: true})}
  //     >Cancel</Button>
  //   </CardActions>
  // </Card>

