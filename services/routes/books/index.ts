import * as S from '@gnothi/schemas'
import dayjs from 'dayjs'
import {eq, sql, and, or} from 'drizzle-orm'
import {Route} from '../types'
import {books, Book} from '../../data/schemas/books'
import {bookshelf} from "../../data/schemas/booksShelf";

const r = S.Routes.routes

export const books_list_request = new Route(r.books_list_request,async (req, context) => {
  return context.m.books.list(req)
})

export const books_post_request = new Route(r.books_post_request, async (req, context) => {
  return context.m.books.post(req)
})
