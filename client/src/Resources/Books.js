import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {spinner, SimplePopover} from "../utils";
import {
  Button,
  ButtonGroup,
  Nav,
  NavDropdown,
  Alert,
} from "react-bootstrap";
import {FaTags, FaUser, FaThumbsUp, FaThumbsDown, FaCheck, FaTimes} from "react-icons/fa"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Books() {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [shelf, setShelf] = useState('ai')  // like|dislike|already_read|remove|recommend

  const dispatch = useDispatch()
  const as = useSelector(state => state.as)
  const user = useSelector(state => state.user)

  const fetchShelf = async () => {
    setFetching(true)
    const {data, code, message} = await dispatch(fetch_(`books/${shelf}`, 'GET'))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setBooks(data)
  }

  useEffect(() => {
    fetchShelf()
  }, [shelf])

  if (notShared) {return <h5>{notShared}</h5>}

  const changeShelf = (shelf_) => {
    if (shelf === shelf_) {return}
    setShelf(shelf_)
  }

  const putOnShelf = async (id, shelf_) => {
    await dispatch(fetch_(`books/${id}/${shelf_}`, 'POST'))
    // _.remove(books, {id})
    setBooks(_.reject(books, {id}))
    // fetchBooks()
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
      <p>
        <FaUser /> {b.author}<br/>
        <FaTags /> {b.topic}</p>
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

  return <>
    <div>
      {renderTabs()}
      {fetching && spinner}
    </div>
    <div>
      <Alert variant='info'>
        <div>AI-recommended self-help books based on your entries.</div>
        <small className="text-muted">
          <div>Use thumbs <FaThumbsUp /> to improve AI's recommendations. Wikipedia & other resources coming soon.</div>
        </small>
      </Alert>
      {books.length > 0 ? books.map(renderBook)
        : shelf === 'ai' ? <p>No AI recommendations yet. This will populate when you have enough entries.</p>
        : null}
    </div>
  </>
}
