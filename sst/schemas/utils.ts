import {z} from "zod";
export * as Utils from './utils'
import dayjs from 'dayjs'

export const DateCol = z.preprocess(
    (v: string | number | Date | undefined) => {
      if (v instanceof Date) {return v}
      if (!v) {return new Date()}
      return dayjs(v).toDate()
    },
    z.date().optional()
)
export const IdCol = z.string().uuid()
export const Passthrough = z.object({}).passthrough()

export const BoolMap = z.record(z.string(), z.boolean())
