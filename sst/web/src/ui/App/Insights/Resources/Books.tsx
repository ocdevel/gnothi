import React, {useCallback, useEffect, useMemo, useState} from "react";
import _ from 'lodash'
import {
  FaTags,
  FaUser,
  FaThumbsUp,
  FaThumbsDown,
  FaCheck,
  FaTimes,
  FaAmazon
} from "react-icons/fa"

import {useStore} from "@gnothi/web/src/data/store"
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import {Menu2} from "@gnothi/web/src/ui/Components/Form"
import {Alert2} from "@gnothi/web/src/ui/Components/Misc"
import {FullScreenDialog} from "../../../Components/Dialog"
import * as S from '@gnothi/schemas'


interface ShelfButton {
  b: S.Books.Book
  shelf: string
  icon: any
  popover: string
}
function ShelfButton({b, shelf, icon, popover}: ShelfButton) {
  const send = useStore(useCallback(s => s.send, []))
  function putOnShelf() {
    send('books_post_request', {book: b, shelf})
  }
  return <Tooltip title={popover}>
    <IconButton variant='outline' onClick={putOnShelf}>
      {icon}
    </IconButton>
  </Tooltip>
}

interface BookComponent {
  b: S.Books.Book
}
function Book({b}: BookComponent) {
  return <Card key={b.id} elevation={0}>
    <CardHeader
      title={b.amazon ? <a href={b.amazon} target='_blank'>{b.title}</a> : b.title}
    />
    <CardContent>
      <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
        <div><FaUser/> {b.author}</div>
        <div><FaTags/> {b.topic}</div>
        {b.amazon && <div><FaAmazon/> Amazon Affiliate Link <a href='https://github.com/lefnire/gnothi/issues/47'
                                                               target='_blank'>?</a></div>}
      </Typography>
      <Typography variant='body1'>{b.text}</Typography>
    </CardContent>
    <CardActions sx={{justifyContent: 'space-around'}}>
      {as ? <>
        <ShelfButton b={b} shelf='recommend' icon={<FaThumbsUp/>} popover="Recommend this book to the user (remove from results)"/>
      </> : <>
        <ShelfButton b={b} shelf='like' icon={<FaThumbsUp/>} popover="Like and save for later (remove from results)"/>
        <ShelfButton b={b} shelf='dislike' icon={<FaThumbsDown/>} popover="Dislike (remove from results)"/>
        <ShelfButton b={b} shelf='already_read' icon={<FaCheck/>} popover="I've read this. Like but don't save (remove from results)"/>
        <ShelfButton b={b} shelf='remove' icon={<FaTimes/>} popover="Remove from results, but don't affect algorithm."/>
      </>}
    </CardActions>
    <Divider/>
  </Card>
}

export default function Books() {
  const send = useStore(useCallback(s => s.send, []))
  const as = useStore(state => state.as)
  // these are the AI-recommended books.
  const insights_books_response = useStore(s => s.res.insights_books_response?.rows)
  const books_list_response = useStore(s => s.res.books_list_response)
  const [shelf, setShelf] = useState('ai')  // like|dislike|already_read|remove|recommend

  const rows = shelf === "ai" ? insights_books_response
    : books_list_response?.rows || []
  const res = books_list_response?.res || {}

  const shelves = [
    {value: "ai", label: "AI Recommends"},
    // Currently no way to remove the thumbs from their fetch-recommended; but we can add back easily, if it's
    // something users want.
    // {value: "cosine", label: "Direct (Cosine) Matches"},
    {value: "like", label: "Liked"},
    {value: "recommend", label: "Therapist Recommends"},
    {value: "already_read", label: "Already Read"},
    {value: "dislike", label: "Disliked"},
    {value: "remove", label: "Removed"},
  ]
  const shelvesObj = _.keyBy(shelves, 'value')

  useEffect(() => {
    // handled via insights_books_response, which is driven by the filter system. It's not a shelf
    if (shelf === "ai") {return}

    send("books_list_request", {shelf})
  }, [shelf])

  if (res?.code === 403) {
    return <h5>{res.detail}</h5>
  }

  const changeShelf = (shelf_) => {
    if (shelf === shelf_) {return}
    setShelf(shelf_)
  }

  return <FullScreenDialog
    title='Books'
    open={true}
    onClose={() => {}}
  >
    <div>
      <Menu2
        label={`Shelf: ${shelvesObj[shelf]?.label}`}
        options={shelves}
        onChange={changeShelf}
      />
      {res?.sending && <CircularProgress />}
    </div>
    <Alert2
      noTop
      severity='info'
      title="AI-recommended self-help books based on your entries."
    >
      Use thumbs <FaThumbsUp /> to improve AI's recommendations. Wikipedia & other resources coming soon. If the recommendations are bad, <a href="https://github.com/lefnire/gnothi/issues/101" target="_blank">try this</a>.
    </Alert2>
    {useMemo(() => rows?.length ?
      rows.map(b => <Book key={b.id} b={b} />)
      : shelf === 'ai' ? <p>No AI recommendations yet. This will populate when you have enough entries.</p>
      : null
    , [rows])}
  </FullScreenDialog>
}
