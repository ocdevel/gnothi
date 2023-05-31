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
import CacheEntry from './Cache'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as S from '@gnothi/schemas'
import * as Link from '../../../Components/Link'
import Insights from '../../Insights/Insights/Insights.tsx'
import dayjs from "dayjs";
import CardActions from "@mui/material/CardActions";


interface Entry {
  entry: S.Entries.entries_list_response
  onClose?: any
}
export default function View({entry, onClose}: Entry) {
  const setEntryModal = useStore(useCallback(s => s.setEntryModal, []))
  const as = useStore(s => s.user.as)
  const [tags, setTags] = useState(entry.tags)

  const id = entry.id!

  function renderButtons() {
    if (as) {return null}
    return <>
      <Button
        className="btn-edit"
        variant='outlined'
        size='small'
        color='primary'
        onClick={() => setEntryModal({mode: "edit", entry})}
        startIcon={<FaPen />}
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
    return <Box px={4}>
      {date}
      <Typography variant='h4' mb={0} color="primary" fontWeight={500} className='title'>{entry.title}</Typography>
      <Box
        display='flex'
        justifyContent='space-between'
        direction='row'
        alignItems='center'
        marginTop={3}
        marginBottom={4}
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
          linkTarget='_blank'
        >
          {entry.text}
        </ReactMarkdown>
      </div>

      <Error
        event={/entries\/entr(ies|y).*/g}
        codeRange={[400, 500]}
      />
    </Box>
  }

  function renderNotes() {
    return <div>
      <NotesList entry_id={id} />
    </div>
  }

  function renderSidebar() {
    return <Insights entry_ids={[id]} key={id} />

  }

  return <Grid container
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
            {renderNotes()}
          </CardContent>
        </Card>
    </Grid>
    <Grid item xs={12} lg={5}>
        {renderSidebar()}
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
