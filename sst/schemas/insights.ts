import {z} from 'zod'
export * as Insights from './insights'

export const Ask = z.object({

}).passthrough()

export const Book = z.object({

}).passthrough()
export type Book = z.infer<typeof Book>
