import React, {useCallback, useEffect, useState} from "react"
import Form from './Form/Form'
import {useStore} from "@gnothi/web/src/data/store"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import List from './List'
import {shares_post_request} from "../../../../../../schemas/shares.ts";
import {useShallow} from "zustand/react/shallow";


export default function Outbound() {
  const [
    sids,
  ] = useStore(useShallow(s => [
    s.res.shares_egress_list_response?.ids,
  ]))

  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  // Due to share-merging, sometimes the right share-id isn't present. If they click
  // "modify sharing" on a group with multiple shares, don't know which one to edit,
  // so just list all.
  // const isList = sharePage.list || (sharePage.id && !hash?.[sharePage.id])

  const anyShares = Boolean(sids?.length)

  return <>
    <Grid container spacing={2}>
      {anyShares && <Grid item xs={12} md={6}>
        <List />
      </Grid>}

      <Grid item xs={12} md={anyShares ? 6 : 12}>
        {/*<Button*/}
        {/*  variant={undefined /*false*!/*/}
        {/*  size='small'*/}
        {/*  onClick={() => setSharePage({list: true})}*/}
        {/*  startIcon={<ArrowBack />}*/}
        {/*>*/}
        {/*  List Shares*/}
        {/*</Button>*/}
        <Form  />
      </Grid>
    </Grid>
  </>
}
