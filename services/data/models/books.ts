import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import dayjs from "dayjs";
import {eq, and, or, not, inArray, lt, asc, desc} from 'drizzle-orm'
import {sql} from "drizzle-orm"
import {books, Book} from '../schemas/books'
import {FnContext} from "../../routes/types";
import {notes, Note} from '../schemas/notes'
import _ from 'lodash'
import {bookshelf} from "../schemas/booksShelf";
import {users} from '../schemas/users'

const shelfDirection = {ai: 0, cosine: 0, like: 1, already_read: 1, dislike: -1, remove: 0, recommend: 1}

type Thumb = {
  id: number
  direction: number
}

export class Books extends Base {
  async list(req: S.Books.books_list_request): Promise<S.Books.books_list_response> {
    const {shelf} = req
    const {db, uid} = this.context
    const res = await db.drizzle.execute<Book>(sql`
      select b.*
      from ${books} b 
      inner join ${bookshelf} bs on bs.book_id=b.id 
          and bs.user_id=${uid} and bs.shelf=${shelf}
      order by bs.score asc
    `)
    return res
  }

  async post(req: S.Books.books_post_request): Promise<S.Books.books_list_response> {
    const {shelf, book} = req
    const {db, uid} = this.context
    const dir = shelfDirection[shelf]
    const {id, ...rest} = book
    await Promise.all([
      db.drizzle.insert(books).values({
          ...book,
          thumbs: dir
        }).onConflictDoUpdate({
          target: books.id,
          set: {
            ...rest,
            thumbs: sql`${books.thumbs} + ${dir}`
          }
        }),
      db.drizzle.insert(bookshelf).values({
        book_id: id,
        user_id: uid,
        shelf
      }).onConflictDoUpdate({
        target: [bookshelf.book_id, bookshelf.user_id],
        set: {shelf}
      })
    ])
    return [{id, shelf}]
  }

  async listThumbs(uid: string): Promise<Thumb[]> {
    const {db} = this.context
    const res = await db.drizzle.select({id: bookshelf.book_id, shelf: bookshelf.shelf})
      .from(bookshelf)
      .where(eq(bookshelf.user_id, uid))
    return res.map(b => ({
      id: b.id,
      direction: shelfDirection[b.shelf]
    }))
  }
}
