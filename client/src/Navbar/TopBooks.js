import {Alert, Modal} from "react-bootstrap";
import {useStoreActions, useStoreState} from "easy-peasy";
import {FaAmazon} from "react-icons/fa";
import {Link} from "react-router-dom";
import React, {useEffect} from "react";
import {FaBook} from "react-icons/all";
import {FullScreenDialog} from "../Helpers/Dialog";


export default function TopBooks({close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const books = useStoreState(s => s.ws.data['insights/top_books/get'])

  useEffect(() => {
    emit(['insights/top_books/get', {}])
  }, [])

  return <>
    <FullScreenDialog open={true} handleClose={close} title="Gnothi members' top-rated books">
      <Alert variant='info'>To see books recommended to you based on your journal entries, go to <Link to='/resources'><FaBook /> Resources</Link>. Below are some (non-personalized) popular books in the community.</Alert>
      {books?.map((b, i) => <div key={i}>
        <a href={b.amazon} target='_blank'>{b.title}</a> -{' '}
        <small className='text-muted'>
          {b.author} - {b.topic} -{' '}
          <FaAmazon /> Affiliate <a href='https://github.com/lefnire/gnothi/issues/47' target='_blank'>?</a>
        </small>
        {i < books.length-1 && <hr/>}
      </div>)}
    </FullScreenDialog>
  </>
}
