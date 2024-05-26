import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback, useMemo} from "react"
import {fmtDate} from "../../../../utils/utils"
import ReactMarkdown from "react-markdown"
import {FaPen} from "react-icons/fa"
import Tags from "../../Tags/Tags"
import 'react-markdown-editor-lite/lib/index.css'
import {Entry as NotesList} from '../Notes/List'
import AddNotes from '../Notes/Create'
import _ from 'lodash'
import {FullScreenDialog} from "../../../Components/Dialog";

import {useStore} from "../../../../data/store"
import Error from "../../../Components/Error";
import CircularProgress from "@mui/material/CircularProgress"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import {TextField2, Checkbox2} from "../../../Components/Form";
import Editor from "../../../Components/Editor";
import {Alert2} from "../../../Components/Misc";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as S from '@gnothi/schemas'
import * as Link from '../../../Components/Link'
import Insights from '../../Insights/Insights/Insights.tsx'
import dayjs from "dayjs";
import CardActions from "@mui/material/CardActions";
import {useShallow} from "zustand/react/shallow";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import {create} from "zustand";


// FIXME find a remark plugin, and refactor Behaviors/utils.tsx to share it
function LinkRenderer(props) {
  return <a href={props.href} target="_blank">{props.children}</a>
}

interface Entry {
  entry: S.Entries.entries_list_response
  onClose?: any
}

export default function View({entry, onClose}: Entry) {
  const setEntryModal = useStore(useCallback(s => s.modals.setEntry, []))
  const as = useStore(s => s.user.as)
  const [tags, setTags] = useState(entry.tags)

  const id = entry.id!

  function renderButtons() {
    if (as) {
      return null
    }
    return <>
      <Button
        className="btn-edit"
        variant='outlined'
        size='small'
        color='primary'
        onClick={() => setEntryModal({mode: "edit", entry})}
        startIcon={<FaPen/>}
      >
        Edit
      </Button>
    </>
  }


  const date = useMemo(() => {
    return <Typography
      variant='body1'
      fontWeight={400}
      marginTop={2}
      marginRight={3}
      className='date'
      color='primary'
    >
      {fmtDate(entry.created_at)}
    </Typography>
  }, [entry.created_at])


  function renderEntry() {
    return (
      <Box px={4}>
        {date}
        <Typography variant='h4' mb={0} color="primary" fontWeight={500} className='title'>{entry.title}</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            direction: 'row',
            alignItems: 'center',
            marginTop: 3,
            marginBottom: 4
          }}
        >
          <Stack spacing={2} direction="column">
            <Tags
              selected={tags}
              setSelected={setTags}
              noClick={true}
              noEdit={true}
              preSelectMain={false}
            />
          </Stack>
        </Box>
        <div className='text'>
          <ReactMarkdown
            components={{link: LinkRenderer}}
          >
            {entry.text}
          </ReactMarkdown>
        </div>

        <Error
          event={/entries\/entr(ies|y).*/g}
          codeRange={[400, 500]}
        />
      </Box>
    );
  }

  const notes = useMemo(() => (
    <div>
      <NotesList entry_id={id}/>
    </div>
  ), [id])

  const sidebar = useMemo(() => <Insights entry_ids={[id]} key={id}/>, [id])
  const reframeCommit = useMemo(() => <ReframeCommit id={entry?.id} />, [entry?.id])

  return <Grid
    container
    className="view"
    alignItems="flex-start"
    spacing={2}
  >
    <Grid item xs={12} lg={7}>

      <Card sx={{borderRadius: 2, height: "100%"}}>
        <CardContent sx={{backgroundColor: "white"}}>
          <CardActions sx={{backgroundColor: "white", justifyContent: "flex-end"}}>
            {renderButtons()}
          </CardActions>
          {renderEntry()}
          {reframeCommit}
          {notes}
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} lg={5}>
      {sidebar}
    </Grid>
  </Grid>
}


// return <Grid container className="view">
//     <Grid item xs={12} lg={7}>
//
//
//        <DialogActions>
//         {/*viewing && <Box sx={{marginRight: 'auto'}}>
//           <AddNotes eid={eid} />
//         </Box>*/}
//          <Box
//            alignItems={'center'}
//            justifyItems={'center'}
//            display='flex'
//          >
//            {renderButtons()}
//            {date}
//          </Box>
//       </DialogActions>
//       <DialogContent>
//         {renderEntry()}
//         {renderNotes()}
//       </DialogContent>
//
//
//     </Grid>
//     <Grid item xs={12} lg={5}>
//       <DialogContent>
//         {renderSidebar()}
//       </DialogContent>
//     </Grid>
//   </Grid>
// }

/**
 * After a user saves their journal entry, add a button called "Reframe", which when clicked reframes the journal
 * entry in a more neutral tone with CBT principles, so they can sort of recalibrate their emotions. Then add a "
 * button "Commit" which replaces the original entry with the reframed version, so they commit to this mindset.
 */
function ReframeCommit({id}) {
  const [
    send,
    clearRes,
    clearReq,
    setEntryModal
  ] = useStore(useCallback(state => [
    state.send,
    state.clearRes,
    state.clearReq,
    state.modals.setEntry
  ], []));
  const [
    entry,
    reframeRequest,
    reframeResponse,
    putRequest,
    upsertResponse
  ] = useStore(useShallow(state => [
    state.res.entries_list_response?.hash?.[id],
    state.req.entries_reframe_request,
    state.res.entries_reframe_response?.first,
    state.req.entries_put_request,
    state.res.entries_upsert_response?.res
  ]))

  const stage = useReframeStore(state => state.stage)
  useEffect(() => {
    const {setStage, stage} = useReframeStore.getState()
    if (reframeRequest && stage === "none") {
      setStage("reframing")
    } else if (reframeResponse && stage === "reframing") {
      useReframeStore.setState({ stage: "reframed", reframed: reframeResponse })
      clearReq(["entries_reframe_request"])
    } else if (putRequest && stage === "reframed") {
      setStage("putting")
      clearRes(["entries_reframe_response"])
    } else if (upsertResponse && stage === "putting") {
      // FIXME this is a hack because the modal isn't properly listening to updates on entries_list_response. Fix that
      // setEntryModal({mode: "view", entry: upsertResponse})
      // Getting [ { "code": "invalid_type", "expected": "string", "received": "undefined", "path": [ "entry_id" ], "message": "Required" } ]
      // Just refresh for now
      window.location.reload();

      setStage("done")
      clearReq(["entries_put_request"])
      clearRes(["entries_put_response"])
    }
  }, [reframeRequest, reframeResponse, putRequest, upsertResponse])

  function reframe() {
    send("entries_reframe_request", { id: entry.id, text: entry.text });
  }
  function commit() {
    const newEntry = {
      ...entry,
      text: useReframeStore.getState().reframed.text
    }
    send("entries_put_request", newEntry)
  }

  console.log({stage})

  function renderContent() {
    if (["putting", "reframed"].includes(stage)) {
      return <Alert severity="success">
        <AlertTitle>Reframed version. Click commit to replace original entry.</AlertTitle>
        <ReactMarkdown components={{link: LinkRenderer}}>
          {reframeResponse?.text}
        </ReactMarkdown>
        <Button
          variant="outlined"
          onClick={commit}
          disabled={stage === "putting"}
          startIcon={stage === "putting" ? <CircularProgress size={10} /> : null}
        >
          Commit
        </Button>
      </Alert>
    }
    return <Button
      variant="outlined"
      onClick={reframe}
      disabled={stage === "reframing"}
      startIcon={stage === "reframing" ? <CircularProgress size={10} /> : null}
    >
      Reframe
    </Button>
  }

  if (stage === "done") { return null; }

  return <Box sx={{px: 4, spacing: 2}}>
    {renderContent()}
  </Box>
}

type Stage = "reframing" | "reframed" | "putting" | "done" | "none"
const useReframeStore = create<{
  stage: Stage
  setStage: (stage: Stage) => void
  entry: any
  reframed: any
}>()((set, get) => ({
  stage: "none",
  setStage: (stage) => set({stage}),
  entry: null,
  reframed: null,
}))