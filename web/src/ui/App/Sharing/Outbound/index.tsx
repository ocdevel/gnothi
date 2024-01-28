import React, {useCallback, useEffect, useState} from "react"
import Form from './Form/Form'
import {useStore} from "@gnothi/web/src/data/store"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import List from './List'
import {shares_post_request} from "../../../../../../schemas/shares.ts";


export default function Outbound() {
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


  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  // Due to share-merging, sometimes the right share-id isn't present. If they click
  // "modify sharing" on a group with multiple shares, don't know which one to edit,
  // so just list all.
  // const isList = sharePage.list || (sharePage.id && !hash?.[sharePage.id])

  const {egress, sid} = view
  const share = (sid && shares?.hash?.[sid]) || {}

  return <>
    <Grid container>
      {
        shares?.ids?.length ? (
          <Grid item>
            <List />
          </Grid>
        ) : null
      }

      <Grid item flex={1}>
        {/*<Button*/}
        {/*  variant={undefined /*false*!/*/}
        {/*  size='small'*/}
        {/*  onClick={() => setSharePage({list: true})}*/}
        {/*  startIcon={<ArrowBack />}*/}
        {/*>*/}
        {/*  List Shares*/}
        {/*</Button>*/}
        {["new", "edit"].includes(egress) ? <Form s={share} /> : null}
      </Grid>
    </Grid>
  </>
}
