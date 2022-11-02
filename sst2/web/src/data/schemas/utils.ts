import {z} from "zod";
import {Events} from "./events";
import {Trigger} from "./api";
export * as Utils from './utils'

export const dateCol = () => z.date().optional().default(() => new Date())
export const idCol = () => z.string().uuid()

export const Passthrough = z.object({}).passthrough()

export type Def<
  I extends z.ZodTypeAny = z.ZodTypeAny,
  O extends z.ZodTypeAny = z.ZodTypeAny
> = {
  eventIn: Events
  eventOut: Events
  schemaIn: I
  schemaOut: O
  triggerIn: Trigger
  triggerOut: Trigger
}

// This seems required to get the type inference to work
export function def<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  def: Def<I, O>
): Def<I, O> {
  return {
    eventIn: def.eventIn as Events,
    eventOut: def.eventOut as Events,
    schemaIn: def.schemaIn,
    schemaOut: def.schemaOut,
    triggerIn: def.triggerIn as Trigger,
    triggerOut: def.triggerOut as Trigger,
  }
}
