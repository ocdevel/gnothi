import {z} from "zod";
export * as Utils from './utils'
import dayjs from 'dayjs'

export const DateCol = z.preprocess(
    (v: string | number | Date | undefined) => {
      if (!v) {return undefined}
      if (v instanceof Date) {return v}
      return dayjs(v).toDate()
    },
    z.date().optional()
)
export const IdCol = z.string().uuid()
export const Passthrough = z.object({}).passthrough()

export const BoolMap = z.record(z.string(), z.boolean())
export type BoolMap = z.infer<typeof BoolMap>

export function boolMapToKeys(boolMap: BoolMap) {
  return Object.entries(boolMap)
    .map(([k, v]) => v ? k : null)
    .filter(v => v)
}

// zodResolver doesn't convert <input type="number" /> values to number, even as it has
// the zod schema. Oh well, just convert manually
export const CoerceNumber = z.number()
  .transform(val => typeof val === "string" ? parseFloat(val) : val)
