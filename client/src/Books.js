import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {AiStatusMsg, spinner, trueKeys, SimplePopover} from "./utils";
import {Button, Table, Form, ButtonGroup, Nav, NavDropdown} from "react-bootstrap";
import {FaTags, FaUser, FaThumbsUp, FaThumbsDown, FaCheck, FaTimes} from "react-icons/fa"
import ForXDays from "./ForXDays"

export default function Books({fetch_, as, tags, aiStatus}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [form, setForm] = useState({days: 365})
  const [tab, setTab] = useState('new')  // like|dislike|already_read|remove|recommend
  const [offline, setOffline] = useState(null)  // like|dislike|already_read|remove|recommend

  if (notShared) {return <h5>{notShared}</h5>}

  const fetchBooks = async () => {
    setOffline(null)
    setFetching(true)
    const body = {...form}
    const tags_ = trueKeys(tags)
    if (tags_.length) { body['tags'] = tags_ }
    const {data, code, message} = await fetch_('books', 'POST', body)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    if (typeof data === 'string') {return setOffline(data)}
    setBooks(data)
  }

  const fetchShelf = async (shelf) => {
    if (shelf === 'new') {
      setBooks([])
      return
    }
    setFetching(true)
    const {data, code, message} = await fetch_(`books/${shelf}`, 'GET')
    setFetching(false)
    setBooks(data)
  }

  const changeTab = (shelf) => {
    if (shelf === tab) {return}
    setTab(shelf)
    fetchShelf(shelf)
  }

  const putOnShelf = async (bid, shelf_) => {
    await fetch_(`books/${bid}/${shelf_}`, 'POST')
    _.remove(books, {id: bid})
    setBooks(_.reject(books, {id: bid}))
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
    <Nav activeKey={tab} onSelect={changeTab}>
      <NavDropdown title="Shelves">
        <NavDropdown.Item eventKey="new">AI Recommends</NavDropdown.Item>
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
    <ForXDays
      form={form}
      setForm={setForm}
      feature={'resources'}
    />
    <div>
      {renderTabs()}
      {fetching ? <>
        <div>{spinner}</div>
        {tab === 'new' && <Form.Text muted>Loading book recommendations (takes a while)</Form.Text>}
      </> : tab === 'new' ? <>
        <Button
          disabled={aiStatus !== 'on'}
          className='bottom-margin'
          variant='primary'
          onClick={fetchBooks}
        >Generate Recommendations</Button>
        <AiStatusMsg status={aiStatus} />
      </> : null}
    </div>
    <div>
      {offline && <p>{offline}</p>}
      {books.length > 0 && <hr/>}
      {books.map(renderBook)}
    </div>
  </>
}
