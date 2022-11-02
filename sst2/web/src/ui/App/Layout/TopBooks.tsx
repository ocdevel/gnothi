import {useStore} from "@gnothi/web/src/data/store"
import {FaAmazon} from "react-icons/fa";
import {Link} from "react-router-dom";
import React, {useEffect} from "react";
import {FaBook} from "react-icons/fa";
import {FullScreenDialog} from "@gnothi/web/src/ui/Components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import {Alert2} from "@gnothi/web/src/ui/Components/Misc";


export default function TopBooks({close}) {
const send = useStore(s => s.send)
  const books = useStore(s => s.res['insights_books_top_response'])

  useEffect(() => {
    send('insights_books_top_response', {})
  }, [])

  return <>
    <FullScreenDialog open={true} onClose={close} title="Gnothi members' top-rated books">
      <DialogContent>
        <Alert2 severity='info' noTop>
          To see books recommended to you based on your journal entries, go to <Link to='/resources'><FaBook /> Resources</Link>. Below are some (non-personalized) popular books in the community.
        </Alert2>
        {books?.map((b, i) => <div key={i}>
          <a href={b.amazon} target='_blank'>{b.title}</a> -{' '}
          <small className='text-muted'>
            {b.author} - {b.topic} -{' '}
            <FaAmazon /> Affiliate <a href='https://github.com/lefnire/gnothi/issues/47' target='_blank'>?</a>
          </small>
          {i < books.length-1 && <hr/>}
        </div>)}
      </DialogContent>
    </FullScreenDialog>
  </>
}
