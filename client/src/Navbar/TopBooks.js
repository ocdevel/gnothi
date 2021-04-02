import {Alert, Modal} from "react-bootstrap";
import {useStoreActions, useStoreState} from "easy-peasy";
import {FaAmazon} from "react-icons/fa";
import {Link} from "react-router-dom";
import React, {useEffect} from "react";
import {FaBook} from "react-icons/all";


export default function TopBooks({close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const books = useStoreState(s => s.ws.data['insights/top_books/get'])

  useEffect(() => {
    emit(['insights/top_books/get', {}])
  }, [])

  return <>
    <Modal size="xl" show={true} onHide={close}>
      <Modal.Header closeButton>
        <Modal.Title>Gnothi members' top-rated books</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant='info'>To see books recommended to you based on your journal entries, go to <Link to='/resources'><FaBook /> Resources</Link>. Below are some (non-personalized) popular books in the community.</Alert>
        {books?.map((b, i) => <div key={i}>
          <a href={b.amazon} target='_blank'>{b.title}</a> -{' '}
          <small className='text-muted'>
            {b.author} - {b.topic} -{' '}
            <FaAmazon /> Affiliate <a href='https://github.com/lefnire/gnothi/issues/47' target='_blank'>?</a>
          </small>
          {i < books.length-1 && <hr/>}
        </div>)}
      </Modal.Body>
    </Modal>
  </>
}
