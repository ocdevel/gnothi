import React, {useEffect, useState} from "react"
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

function Share({s}) {
  let myGroups = useStore(s => s.res.groups_mine_list_response?.hash)
  const setSharePage = useStore(s => s.setSharePage)

  function renderList(icon, arr, map_=_.identity) {
    arr = _.compact(arr)
    if (!arr?.length) {return null}
    return <div>{icon} {arr.map(map_).join(', ')}</div>
  }

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

export function SharingModal() {
  const send = useStore(s => s.send)
  const shares = useStore(s => s.res.shares_egress_list_response)
  const sharePage = useStore(s => s.sharePage)
  const setSharePage = useStore(a => a.setSharePage)

  useEffect(() => {
    send('shares_egress_list_request', {})
  }, [])

  if (!sharePage) {return null}
  if (!shares?.ids) {return null}
  const {ids, hash} = shares

  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  // Due to share-merging, sometimes the right share-id isn't present. If they click
  // "modify sharing" on a group with multiple shares, don't know which one to edit,
  // so just list all.
  const isList = sharePage.list || (sharePage.id && !obj?.[sharePage.id])

  function renderContent() {
    if (isList) {
      return <div>
        {ids?.map(sid => <Share key={sid} s={hash[sid]}/>)}
      </div>
    }
    return <div>
      <Button
        variant={false}
        size='small'
        onClick={() => setSharePage({list: true})}
        startIcon={<ArrowBack />}
      >
        List Shares
      </Button>
      {sharePage.create ? <ShareForm />
        : sharePage.id ? <ShareForm s={hash[sharePage.id]} />
        : null}
    </div>
  }

  function renderButtons() {
    if (sharePage.list) {
      return <>
        <Button
          variant='contained'
          color='info'
          onClick={() => setSharePage({create: true})}
        >New Share</Button>
      </>
    }
    return null
  }

  function close() {
    setSharePage(null)
  }

  return <>
    <FullScreenDialog
      open={sharePage || false}
      onClose={close}
      title='Sharing'
      buttons={renderButtons()}
    >
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </FullScreenDialog>
  </>
}
