import {z} from 'zod'
export * as Books from './books'
import {books} from '../services/data/schemas/books'
import {bookshelf, } from "../services/data/schemas/booksShelf";
import {createSelectSchema} from "drizzle-zod";
import {Passthrough} from "./utils";
import {integer, varchar} from "drizzle-orm/pg-core";

const Book = createSelectSchema(books)

export const books_list_request = z.object({
  shelf: z.string()
})
export type books_list_request = z.infer<typeof books_list_request>
export const books_list_response = Book
export type books_list_response = z.infer<typeof books_list_response>

export const books_top_list_request = Passthrough
export type books_top_list_request = z.infer<typeof books_top_list_request>
export const books_top_list_response = Book
export type books_top_list_response = z.infer<typeof books_top_list_response>

export const books_post_request = z.object({
  shelf: z.string(),
  // we're not saving all books which are recommended from the
  book: Book.partial({
    author: true,
    topic: true,
    thumbs: true,
    amazon: true
  })
})
export type books_post_request = z.infer<typeof books_post_request>
export const books_post_response = books_list_request
export type books_post_response = z.infer<typeof books_post_response>

export const routes = {
  books_list_request: {
    i: {
      e: 'books_list_request',
      s: books_list_request,
      snoopable: true,
      t: {ws: true},
    },
    o: {
      e: 'books_list_response',
      s: books_list_response,
      t: {ws: true},
      keyby: 'id'
    }
  },
  books_post_request: {
    i: {
      e: 'books_post_request',
      s: books_post_request,
      t: {ws: true},
    },
    o: {
      e: 'books_post_response',
      s: books_post_response,
      event_as: "books_list_response",
      t: {ws: true},
      // TODO removing this since insights_books_response is keyed by view. I need to consolidate
      // we remove the new-shelf book from the current viewing list.
      // This will also do so if they click the same shelf they're viewing (repeat),
      // but it's edge-case enough to not break this otherwise elegant solution
      // op: "remove",
      // keyby: 'id'
    }
  },
}
