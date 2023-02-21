import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {fmtDate} from "../../../../utils/utils"
import ReactMarkdown from "react-markdown"
import {FaPen} from "react-icons/fa"
import Tags from "../../Tags/Tags"
import 'react-markdown-editor-lite/lib/index.css'
import {AddNotes, NotesList} from '../Notes'
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
import CacheEntry from './Cache'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as S from '@gnothi/schemas'
import * as Link from '../../../Components/Link'
import Insights from '../../Insights/Insights'


interface Entry {
  entry: S.Entries.entries_list_response
  onClose?: any
}
export default function View({entry, onClose}: Entry) {
  const setEntryModal = useStore(useCallback(s => s.setEntryModal, []))
  const as = useStore(s => s.user.as)
  const [tags, setTags] = useState(entry.tags)

  const {id} = entry


  function renderButtons() {
    if (as) {return null}
    return <>
      <Button
        className="btn-edit"
        variant='outlined'
        color='primary'
        onClick={() => setEntryModal({mode: "edit", entry})}
        startIcon={<FaPen />}
      >
        Edit
      </Button>
    </>
  }

  function renderEntry() {
    return <Box>
      <Typography variant='h2'>{entry.title}</Typography>
      <ReactMarkdown
        linkTarget='_blank'
      >
        {entry.text}
      </ReactMarkdown>

      <Error
        event={/entries\/entr(ies|y).*/g}
        codeRange={[400, 500]}
      />

      <Box display='flex' justifyContent='space-between' direction='row' alignItems='center'>
        <Tags
          selected={tags}
          setSelected={setTags}
          noClick={true}
          noEdit={true}
          preSelectMain={false}
        />
      </Box>
    </Box>
  }

  function renderNotes() {
    return <Card>
      <CardHeader title='Notes' />
      <CardContent>
        <NotesList entry_id={id} />
      </CardContent>
    </Card>
  }

  function renderSidebar() {
    return <Card>
      <Insights entry_ids={[id]} key={id} />
    </Card>
  }

  return <Grid container className="view">
    <Grid item xs={12} lg={8}>
      <DialogContent>
        {renderEntry()}
      </DialogContent>
      <DialogActions>
        {/*viewing && <Box sx={{marginRight: 'auto'}}>
          <AddNotes eid={eid} />
        </Box>*/}
        {renderButtons()}
      </DialogActions>
    </Grid>
    <Grid item xs={12} lg={4}>
      <DialogContent>
        {renderSidebar()}
      </DialogContent>
    </Grid>
  </Grid>
}
