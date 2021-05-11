import _ from "lodash"
import React, {useCallback, useEffect, useState} from "react"
import {FaPen, FaRobot, FaSort, FaTrash} from 'react-icons/fa'
import {useStoreState, useStoreActions} from "easy-peasy";


import Sortable from "./Helpers/Sortable";
import {IoReorderFourSharp} from "react-icons/all";

import {
  Chip,
  Stack,
  Button,
  DialogContent,
  Grid,
  TextField,
  Divider,
  Card,
  CardContent, IconButton, InputBase, Paper, FormControlLabel, Switch, CardHeader, Typography, Box
} from '@material-ui/core'
import {CheckCircle, Label, Create, Reorder, Delete} from "@material-ui/icons";
import {FullScreenDialog} from "./Helpers/Dialog";
import {makeStyles} from "@material-ui/core/styles";
import {Controller} from "react-hook-form";
import {makeForm, yup} from "./Helpers/Form";

const tagSchema = yup.object().shape({
  name: yup.string().required(),
  ai: yup.boolean()
})
const useForm = makeForm(tagSchema, {name: '', ai: true})

const styles = {
  paper: {
    my: 1,
    display: 'flex',
    py: 1,
    px: 2,
    alignItems: 'center',
    width: '100%'
  },
  inputBase: {ml: 1, flex: 1}
}

function NewTag() {
  const emit = useStoreActions(actions => actions.ws.emit)
  const form = useForm()

  function submit(data) {
    emit(['tags/tags/post', data])
    form.reset()
  }

  return <form onSubmit={form.handleSubmit(submit)}>
    <Paper sx={styles.paper}>
      <Controller
        name='name'
        control={form.control}
        render={({field}) => <InputBase
          sx={styles.inputBase}
          placeholder="New tag name"
          value={field.value}
          onChange={field.onChange}
        />}
      />

      <Button
        size='small'
        type='submit'
        color="primary"
        variant='contained'
      >Add</Button>
    </Paper>
  </form>
}

function TagForm({tag}) {
  const emit = useStoreActions(actions => actions.ws.emit)
  // Can't use useForm() since need custom onChange (which tiggers submit)
  const [name, setName] = useState(tag.name)
  const [ai, setAi] = useState(tag.ai)
  const id = tag.id

  function submit(data) {
    emit(['tags/tag/put', data])
  }
  const waitSubmit = useCallback(_.debounce(submit, 200), [])

  const changeName = e => {
    const name = e.target.value
    waitSubmit({id, name, ai})
    setName(e.target.value)
  }
  const changeAi = e => {
    const ai = e.target.checked
    submit({id, name, ai})
    setAi(ai)
  }

  const destroyTag = async () => {
    if (window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      emit(['tags/tag/delete', {id}])
    }
  }

  return <div>
    <Paper sx={styles.paper}>
      <Reorder />
      <InputBase
        sx={styles.inputBase}
        placeholder="Tag Name"
        value={name}
        onChange={changeName}
      />
      <Divider orientation="vertical" />
      <FormControlLabel
        control={<Switch checked={ai} onChange={changeAi} name="ai" color='primary'/>}
        label={<FaRobot />}
      />
      {tag.main ? <div /> : <IconButton onClick={destroyTag}>
        <Delete />
      </IconButton>}
    </Paper>
  </div>
}

function TagModal({close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const tags = useStoreState(s => s.ws.data['tags/tags/get'])
  const [showMore, setShowMore] = useState(false)

  function toggleMore() {setShowMore(!showMore)}
  function renderToggle() {
    return <Box sx={{display:'flex', alignItems: 'center'}}>
      <Box sx={{pr: 2}}>About</Box>
      <FormControlLabel
        control={<Switch checked={true} name="ai" color='primary'/>}
        label={<FaRobot />}
      />
    </Box>
  }

  function renderHelp() {
    return <Card>
      <CardHeader title='About Tags' />
      <CardContent>
        <Typography variant='body1'>
          <div>Tags organize your journal entries by topic (eg personal, work, dreams). Some apps do this via <em>multiple journals</em>, like folders on a computer. Gnothi uses tags instead, adding more flexibility for entry-sharing & AI.</div>
          <Button size='small' onClick={toggleMore}>{showMore ? "Hide examples" : "Show examples / ideas"}</Button>
          {showMore && <div>
            Here's how Gnothi's creator uses tags:<ul>
            <li><b>Main</b>: My default. Most things go here.</li>
            <li><b>Dreams</b>: I record my dreams, as I'll be building some cool dream-analysis tooling into Gnothi. I disable <FaRobot /> on this tag, since I don't want Gnothi matching-making me to books / groups based on my dreams - that would be weird.</li>
            <li><b>Therapy</b>: I share this tag (see sidebar > Sharing) with my therapist. Before each session she can either read my entries, or run some AI reports (summarization, question-answering) for a quick update. That way we hit the ground running in our session. This is an example of the value of multiple tags per entry; I'll tag most things Main, and I'll <em>also</em> tag an entry Therapy if it's something I'm comfortable with my therapist reading.</li>
          </ul>
          </div>}
        </Typography>
      </CardContent>
      <CardHeader title={renderToggle()} />
      <CardContent>
        <Typography variant='body1'>
          By default, Gnothi will use all of your tags to decide which entries "represent you". Those entries are then used for match-making you with books, groups, therapists, etc. There will likely be tags you don't want used; the obvious example is Dreams. If you dream-journal, create a tag called "Dreams" and un-check its <FaRobot />. That way you won't get super weird book / group recommendations.
        </Typography>
      </CardContent>
    </Card>
  }

  function reorder(tags) {
    const data = _.map(tags, ({id}, order) => ({id, order}))
    emit(['tags/tags/reorder', data])

  }
  const renderTag = tag => <TagForm tag={tag} />

  return (
    <FullScreenDialog
      open={true}
      onClose={close}
      title="Tags"
    >
      <DialogContent>
        <Grid justifyContent='space-between' container spacing={3}>
          <Grid item sm={12} md={7}>
            <Sortable items={tags} render={renderTag} onReorder={reorder} />
            <NewTag />
          </Grid>
          <Grid item sm={12} md={5}>
            {renderHelp()}
          </Grid>
        </Grid>
      </DialogContent>
    </FullScreenDialog>
  )
}

export default function Tags({
  selected=null,
  setSelected=null,
  noEdit=false,
  noClick=false,
  preSelectMain=false
}) {
  const [editTags, setEditTags] = useState(false)
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(actions => actions.ws.emit)
  // tags sorted on server
  const tags = useStoreState(s => s.ws.data['tags/tags/get'])
  const selectedTags = useStoreState(s => s.ws.data.selectedTags)
  noEdit = as || noEdit

  // no selected,setSelected props indicates using global tags
  const selectedTags_ = selected || selectedTags

  useEffect(() => {
    if (tags.length && preSelectMain) {
      const main = _.find(tags, t=>t.main)
      if (main) {
        selectTag(main.id, true)
      }
    }
  }, [tags])


  const selectTag = async (id, v) => {
    if (setSelected) {
      setSelected({...selectedTags_, [id]: v})
    } else {
      emit(['tags/tag/toggle', {id}])
      // await getTags()  # fixme
    }
  }
  // const clear = async () => {
  //   _.each(tags, t => {selectTag(t.id,false)})
  // }
  const showEditTags = () => {
    if (noEdit) {return}
    setEditTags(true)
  }
  const closeEditTags = () => setEditTags(false)

  const renderTag = t => {
    const selected_ = selectedTags_[t.id]
    const opts = selected_ ? {icon: <CheckCircle />} : {variant: 'outlined'}
    return <Grid item key={t.id}>
      <Chip
        disabled={noClick}
        {...opts}
        onClick={() => selectTag(t.id, !selected_)}
        label={t.name}
      />
    </Grid>
  }

  const labelProps = noEdit ? {
    sx: {border: 'none'},
    icon: <Label />
  } : {
    onClick: showEditTags,
    icon: <Create />,
    color: "primary"
  }
  return <>
    {editTags && <TagModal close={closeEditTags} />}
    <Grid container spacing={1}>
      <Grid item>
        <Chip
          variant="outlined"
          label={"Tags"}
          {...labelProps}
        />
      </Grid>
      {tags.map(renderTag)}
    </Grid>
  </>
}

export const MainTags = <Tags />
