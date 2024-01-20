import {useNavigate, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import _ from 'lodash'

import {useStore} from "../../../../data/store"
import Error from "../../../Components/Error";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import FormHelperText from "@mui/material/FormHelperText";
import {BasicDialog} from "../../../Components/Dialog";
import Editor from "../../../Components/Editor";
import {yup, makeForm, Checkbox2, Select2, TextField2} from "../../../Components/Form";
import {shallow} from "zustand/shallow";

const notYet = <b>This feature isn't yet built, but you can enable it now and I'll notify you when it's available.</b>

const privacies = [{
  k: 'public',
  v: 'Public',
  h: "Any user can join this group. It's listed in the groups directory, and matched to users via Gnothi AI."
}, {
  k: 'matchable',
  v: 'Matchable',
  h: <>Any user can join this group, but they won't see it unless Gnothi AI considers them a good fit based on their journal entries. This is a layer of privacy for sensitive groups, Gnothi strives to find good culture fits.</>
}, {
  k: 'private',
  v: 'Private',
  h: <>Group administrators must manually send invite links to users for them to join this group. {notYet}</>
}]
const privaciesObj = _.keyBy(privacies, 'k')

const perks = [{
  k: 'perk_member',
  v: "Membership",
  h: "You can charge users to join this group, or suggest a donation for membership. Sounds mean, but consider groups who's moderator is donating time to ensure quality attention to its members."
}, {
  k: "perk_entry",
  v: "Journal Feedback",
  h: "You can charge to provide personal feedback on journal entries which members share with the group. Anyone can comment on each others' entries, but perhaps you're an expert in the group's topic and they'd find your feedback particularly valuable. It's on you to keep up with the entries as they're created, but I'll do my best to provide good tooling for the moderators."
}, {
  k: "perk_video",
  v: "Video Sessions",
  h: <>You can charge to run scheduled video sessions with your members. When available, I'll provide scheduling and video tooling. {notYet}</>
}]

const perk_field = yup
  .number()
  .nullable()
  .min(1)
  .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value))

const schema = yup.object().shape({
  title: yup.string().required(),
  text_short: yup.string().required(),
  text_long: yup.string(),
  privacy: yup.string().required(),
  perk_member: perk_field,
  perk_member_donation: yup.boolean(),
  perk_entry: perk_field,
  perk_entry_donation: yup.boolean(),
  perk_video: perk_field,
  perk_video_donation: yup.boolean(),
})

const defaults = {
  title: "",
  text_short: "",
  text_long: "",
  privacy: "public",
  perk_member: null,
  perk_member_donation: false,
  perk_entry: null,
  perk_entry_donation: false,
  perk_video: null,
  perk_video_donation: false,
}
const useForm = makeForm(schema, defaults)

function Perk({form, perk}) {
  return <Grid item xs={12} sm={4}>
    <TextField2
      name={perk.k}
      label={perk.v}
      placeholder="Free"
      type="number"
      form={form}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>
      }}
    />
    <Checkbox2
      name={`${perk.k}_donation`}
      label="Suggested Donation"
      form={form}
    />
    <FormHelperText>{perk.h}</FormHelperText>
  </Grid>
}

export function EditModal() {
  const navigate = useNavigate()
  const {view, id} = useStore(s => s.groups.view) // t-up for hash?.[id] below
  const [
    as,
    groupPost,
    groupPut,
    group,
  ] = useStore(s => [
    s.user?.as,
    s.res.groups_post_response,
    s.res.groups_put_response?.res,
    s.res.groups_list_response?.hash?.[id]
  ], shallow)
  const [
    send,
    clearEvents,
    close,
  ] = useStore(useCallback(s => [
    s.send,
    s.clearEvents,
    () => s.groups.setView({view: null, id: null})
  ], []))
  const show = view == "edit" && id

  const form = useForm(group)
  const privacy = form.watch('privacy')

  useEffect(() => {
    return function() {
      clearEvents(['groups_post_response', 'groups_put_response'])
    }
  }, [])

  useEffect(() => {
    if (groupPost?.id) {
      close()
      navigate("groups/" + groupPost.id)
    }
  }, [groupPost])

  useEffect(() => {
    if (groupPut?.code === 200) {close()}
  }, [groupPut])

  function submit(data) {
    if (group) {
      send('groups_put_request', {id: group.id, ...data})
    } else {
      send('groups_post_request', data)
    }
  }

  const renderButtons = () => {
    if (as) return null
    if (groupPost?.submitting) return <CircularProgress />

    return <>
      <Button size="small" onClick={close}>
        Cancel
      </Button>
      <Button
        color="primary"
        variant="outlined"
        onClick={form.handleSubmit(submit)}
      >Submit
      </Button>
    </>
  }

  const renderForm = () => {
    let short_placeholder = "Short description of your group."
    if (!group) {
      short_placeholder += " You'll be able to add a long description with links, formatting, resources, etc on the next screen."
    }

    return <>
      <form onSubmit={form.handleSubmit(submit)}>
        <Grid container spacing={2} direction='column'>

          <Grid item>
            <TextField2 name='title' label='Title' form={form}/>
          </Grid>

          <Grid item>
            <TextField2
              name='text_short'
              placeholder={short_placeholder}
              label="Short Description"
              minRows={3}
              multiline
              form={form}
            />
          </Grid>

          {group && <Grid item>
            <Editor
              placeholder="Write a description about your group, including any links to relevant material."
              name='text_long'
              form={form}
            />
          </Grid>}

          <Grid item>
            <Select2
              name='privacy'
              label='Privacy'
              options={privacies.map(p => ({value: p.k, label: p.v}))}
              helperText={privaciesObj[privacy].h}
              form={form}
            />

            <Card>
              <CardHeader title="Perks" />
              <CardContent>
                <Grid container spacing={3}>
                  {perks.map(p => <Perk key={p.k} perk={p} form={form} />)}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </form>
    </>
  }

  return <>
    <BasicDialog
      open={show}
      size='xl'
      onClose={close}
      title={group ? "Edit Group" : "Create a Group"}
    >
      <DialogContent>
        {renderForm()}
        <Error event={/groups\/groups\/post/g} codes={[400,401,403,422]}/>
      </DialogContent>

      <DialogActions>
        {renderButtons()}
      </DialogActions>
    </BasicDialog>
  </>;
}
