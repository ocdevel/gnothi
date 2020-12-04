import {
  Nav,
  Row,
  Col,
  Card, Button
} from "react-bootstrap";
import {
  FaBook,
  FaCouch
} from 'react-icons/fa'
import React, {useState} from "react"
import Books from './Books'
import Therapists from './Therapists'

export default function Resources() {
  const [books, setBooks] = useState(true)
  const [therapists, setTherapists] = useState(false)

  const tabs = <div className='mb-3'>
    <Button
      size="sm"
      variant={books ? 'dark' : 'outline-dark'}
      onClick={() => setBooks(!books)}
    >Books</Button>{' '}
    <Button
      size="sm"
      variant={therapists ? 'dark' : 'outline-dark'}
      onClick={() => setTherapists(!therapists)}
    >Therapists</Button>
  </div>

  const lg = books && therapists ? 2 : 1
  return <div>
    {tabs}
    <Row lg={lg} md={lg} sm={1} xs={1}>
      {books && <Col>
        <Card><Card.Body>
          <Card.Title><FaBook /> Books</Card.Title>
          <Card.Text><Books /></Card.Text>
        </Card.Body></Card>
      </Col>}
      {therapists && <Col>
        <Card><Card.Body>
          <Card.Title><FaCouch /> Therapists</Card.Title>
          <Card.Text><Therapists setShowTherapists={setTherapists} /></Card.Text>
        </Card.Body></Card>
      </Col>}
    </Row>
  </div>
}
