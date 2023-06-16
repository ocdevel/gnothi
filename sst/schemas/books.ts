import {z} from 'zod'
export * as Books from './books'
import {books} from '../services/data/schemas/books'
import {bookshelf, } from "../services/data/schemas/booksShelf";
import {createSelectSchema} from "drizzle-zod";
import {Passthrough} from "./utils";

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
  id: z.number(),
  shelf: z.string()
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
      op: "remove",
      t: {ws: true},
      keyby: 'id'
    }
  },
}
