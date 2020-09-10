import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {spinner, SimplePopover} from "./utils";
import {Button, ButtonGroup, Nav, NavDropdown} from "react-bootstrap";
import {FaTags, FaUser, FaThumbsUp, FaThumbsDown, FaCheck, FaTimes} from "react-icons/fa"

export default function Books({fetch_, as, aiStatus}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [shelf, setShelf] = useState('ai')  // like|dislike|already_read|remove|recommend

  const fetchShelf = async () => {
    setFetching(true)
    const {data, code, message} = await fetch_(`books/${shelf}`, 'GET')
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
    await fetch_(`books/${id}/${shelf_}`, 'POST')
    _.remove(books, {id})
    setBooks(_.reject(books, {id}))
    // fetchBooks()
  }

  const ShelfButton = ({bid, shelf_, icon, popover}) => (
    <SimplePopover text={popover}>
      <Button variant='outline-dark' onClick={() => putOnShelf(bid, shelf_)}>
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
    <br/>
  </>

  const renderBook = b => (
    <div key={b.id}>
      <h5>{b.title}</h5>
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
      {books.length > 0 ? <>
        <hr/>
        {books.map(renderBook)}
      </> : shelf === 'ai' ? <>
        <p>No AI recommendations yet. This will populate when you have enough entries.</p>
      </> : null}
    </div>
  </>
}
