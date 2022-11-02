import {z} from 'zod'
export * as Shares from './shares'

export const ShareTag = z.object({
  share_id: z.string().uuid(), // shares.id FK
  tag_id: z.string().uuid(), // tags.id FK
  selected: z.boolean().default(true),
})

export const ShareUser = z.object({
  share_id: z.string().uuid(), // shares.id FK
  obj_id: z.string().uuid(), // users.id FK
})

export const ShareGroup = z.object({
  share_id: z.string().uuid(), // shares.id FK
  obj_id: z.string().uuid(), // groups.id FK
})
