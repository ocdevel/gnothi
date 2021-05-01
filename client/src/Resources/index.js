import {
  Button
} from "react-bootstrap";
import {
  FaBook,
  FaCouch
} from 'react-icons/fa'
import React, {useState} from "react"
import Books from './Books'
import Therapists from './Therapists'
import {Grid} from "@material-ui/core";

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
    <Grid container lg={lg} md={lg} sm={1} xs={1}>
      {books && <Grid item>
        <h5><FaBook /> Books</h5>
        <Books />
      </Grid>}
      {therapists && <Grid item>
        <h5><FaCouch /> Therapists</h5>
        <Therapists setShowTherapists={setTherapists} />
      </Grid>}
    </Grid>
  </div>
}
