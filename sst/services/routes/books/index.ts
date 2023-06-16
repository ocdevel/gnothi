import * as S from '@gnothi/schemas'
import dayjs from 'dayjs'
import {eq, sql, and, or} from 'drizzle-orm'
import {Route} from '../types'
import {books, Book} from '../../data/schemas/books'
import {bookshelf} from "../../data/schemas/booksShelf";

const r = S.Routes.routes

export const books_list_request = new Route(r.books_list_request,async (req, context) => {
  const {m, uid, db} = context
  const {shelf} = req
  const res = await db.drizzle.execute<Book>(sql`
    select b.*
    from ${books} b 
    inner join ${bookshelf} bs on bs.book_id=b.id 
        and bs.user_id=${uid} and bs.shelf=${shelf}
    order by bs.score asc
  `)
  return res.rows
})

export const books_post_request = new Route(r.books_post_request, async (req, context) => {
  const {uid, db} = context
  const {shelf, id} = req
  await db.drizzle.execute(sql`
    insert into ${bookshelf} (book_id, user_id, shelf)      
    values (${id}, ${uid}, ${shelf})
    on conflict (book_id, user_id) do update set shelf=${shelf}
  `)
  const dir = {ai: 0, cosine: 0, like: 1, already_read: 1, dislike: -1, remove: 0, recommend: 1}[shelf]
  await db.drizzle.execute(sql`
    update ${books} set thumbs=thumbs+${dir} where id=${id}
  `)
  // TODO
  // Bookshelf.update_books(db, user_id)
  return [{id, shelf}]
})
