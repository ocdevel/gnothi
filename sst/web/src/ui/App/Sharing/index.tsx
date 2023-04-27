import React, {useCallback, useEffect, useState} from "react"
import _ from 'lodash'
import ShareForm from './Form'
import {useStore} from "@gnothi/web/src/data/store"
import {FaRegComments, FaUser} from "react-icons/fa";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";

import {FullScreenDialog} from "@gnothi/web/src/ui/Components/Dialog";
import Add from "@mui/icons-material/Add";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import shallow from "zustand/shallow";
import Grid from "@mui/material/Grid";
import {CTA} from "../../Components/AppBar";

function ListItem({s}) {
  let myGroups = useStore(s => s.res.groups_mine_list_response?.hash)
  const setSharePage = useStore(s => s.setSharePage)

  function renderList(icon: JSX.Element, arr: any[], map_=_.identity) {
    arr = _.compact(arr)
    if (!arr?.length) {return null}
    return <div>{icon} {arr.map(map_).join(', ')}</div>
  }

  return <Card>Share List Item (TODO)</Card>

  return <Card
    sx={{mb: 2, cursor: 'pointer'}}
    onClick={() => setSharePage({id: s.share.id})}
  >
    <CardContent>
      {renderList(<FaUser />, s?.users)}
      {renderList(<FaRegComments />, s?.groups, id => myGroups[id].title)}
    </CardContent>
  </Card>
}

export default function SharingModal() {
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

  useEffect(() => {
    send('shares_egress_list_request', {})
  }, [])

  const open = view.view !== null

  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  // Due to share-merging, sometimes the right share-id isn't present. If they click
  // "modify sharing" on a group with multiple shares, don't know which one to edit,
  // so just list all.
  // const isList = sharePage.list || (sharePage.id && !hash?.[sharePage.id])

  const clickNew = useCallback(() => {
    setView({view: "new", sid: null})
  }, [])
  const close = useCallback(() => {
    setView({sid: null, view: null})
  }, [])
  const ctas: CTA[] = [{
    name: "New Share",
    onClick: clickNew,
  }]

  if (!shares?.ids) {return null}
  const {ids, hash} = shares

  return <>
    <FullScreenDialog
      className="sharing modal"
      open={open}
      onClose={close}
      title='Sharing'
      ctas={ctas}
    >
      <DialogContent>
        <Grid container>
          <Grid item>
            <div>
              {ids?.map(sid => <ListItem key={sid} s={hash[sid]}/>)}
            </div>
          </Grid>
          <Grid item>
            {/*<Button*/}
            {/*  variant={undefined /*false*!/*/}
            {/*  size='small'*/}
            {/*  onClick={() => setSharePage({list: true})}*/}
            {/*  startIcon={<ArrowBack />}*/}
            {/*>*/}
            {/*  List Shares*/}
            {/*</Button>*/}
            {view.view === "new" ? <ShareForm />
              : view.view == "edit" && view.sid ? <ShareForm s={hash[view.sid]} />
              : null}
          </Grid>
        </Grid>
      </DialogContent>
    </FullScreenDialog>
  </>
}
