import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {spinner, SimplePopover} from "../Helpers/utils";
import {
  Button,
  ButtonGroup,
  Nav,
  NavDropdown,
  Alert,
} from "react-bootstrap";
import {
  FaTags,
  FaUser,
  FaThumbsUp,
  FaThumbsDown,
  FaCheck,
  FaTimes,
  FaAmazon
} from "react-icons/fa"
import {Link} from 'react-router-dom'

import {useStoreState, useStoreActions} from "easy-peasy";

export default function Books() {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.user.as)
  const booksGet = useStoreState(s => s.ws.res['insights/books/get'])
  const books = useStoreState(s => s.ws.data['insights/books/get'])
  const [shelf, setShelf] = useState('ai')  // like|dislike|already_read|remove|recommend
  const [removed, setRemoved] = useState([])

  useEffect(() => {
    emit(["insights/books/get", {shelf}])
    setRemoved([])
  }, [shelf])

  if (booksGet?.code === 403) {
    return <h5>{booksGet.detail}</h5>
  }

  const changeShelf = (shelf_) => {
    if (shelf === shelf_) {return}
    setShelf(shelf_)
  }

  const putOnShelf = async (id, shelf_) => {
    emit(['insights/books/post', {id, shelf: shelf_}])
    setRemoved([...removed, id])
  }

  const ShelfButton = ({bid, shelf, icon, popover}) => (
    <SimplePopover text={popover}>
      <Button variant='outline-dark' onClick={() => putOnShelf(bid, shelf)}>
        {icon()}
      </Button>
    </SimplePopover>
  )

  const renderTabs = () => <>
    <Nav activeKey={shelf} onSelect={changeShelf}>
      <NavDropdown title="Shelves">
        <NavDropdown.Item eventKey="ai">AI Recommends</NavDropdown.Item>
        <NavDropdown.Item eventKey="cosine">Direct (Cosine) Matches</NavDropdown.Item>
        <NavDropdown.Item eventKey="like">Liked</NavDropdown.Item>
        <NavDropdown.Item eventKey="recommend">Therapist Recommends</NavDropdown.Item>
        <NavDropdown.Item eventKey="already_read">Already Read</NavDropdown.Item>
        <NavDropdown.Item eventKey="dislike">Disliked</NavDropdown.Item>
        <NavDropdown.Item eventKey="remove">Removed</NavDropdown.Item>
      </NavDropdown>
    </Nav>
  </>

  const renderBook = b => (
    <div key={b.id}>
      <h5>
        {b.amazon ? <a href={b.amazon} target='_blank'>{b.title}</a> : b.title}
      </h5>
      <div className='text-muted mb-3'>
        <div><FaUser /> {b.author}</div>
        <div><FaTags /> {b.topic}</div>
        {b.amazon && <div><FaAmazon /> Amazon Affiliate Link <a href='https://github.com/lefnire/gnothi/issues/47' target='_blank'>?</a></div>}
      </div>
      <p>{b.text}</p>
      <div>
        <ButtonGroup>
          {as ? <>
            <ShelfButton bid={b.id} shelf='recommend' icon={FaThumbsUp} popover="Recommend this book to the user (remove from results)" />
          </> : <>
            <ShelfButton bid={b.id} shelf='like' icon={FaThumbsUp} popover="Like and save for later (remove from results)" />
            <ShelfButton bid={b.id} shelf='dislike' icon={FaThumbsDown} popover="Dislike (remove from results)" />
            <ShelfButton bid={b.id} shelf='already_read' icon={FaCheck} popover="I've read this. Like but don't save (remove from results)" />
            <ShelfButton bid={b.id} shelf='remove' icon={FaTimes} popover="Remove from results, but don't affect algorithm." />
          </>}
        </ButtonGroup>
      </div>
      <hr />
    </div>
  )

  const books_ = books.length ?
    _(books).reject(b => ~removed.indexOf(b.id)).map(renderBook).value()
    : shelf === 'ai' ? <p>No AI recommendations yet. This will populate when you have enough entries.</p>
    : null


  return <>
    <div>
      {renderTabs()}
      {booksGet?.sending && spinner}
    </div>
    <div>
      <Alert variant='info'>
        <div>AI-recommended self-help books based on your entries.</div>
        <small className="text-muted">
          <div>Use thumbs <FaThumbsUp /> to improve AI's recommendations. Wikipedia & other resources coming soon. If the recommendations are bad, <a href="https://github.com/lefnire/gnothi/issues/101" target="_blank">try this</a>.</div>
        </small>
      </Alert>
      {books_}
    </div>
  </>
}
