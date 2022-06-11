import {z} from 'zod'

const dateSchema = z.preprocess((arg) => {
  if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date());

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  cognito_id: z.string(),
  created_at: dateSchema.optional(), // timestamp with time zone default now()
  updated_at: dateSchema.optional(), // timestamp with time zone default now(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.string().optional(),
  orientation: z.string().optional(),
  birthday: dateSchema.optional(), // date
  timezone: z.string().optional(),
  bio: z.string().optional(),
  is_superuser: z.boolean().optional(),
  is_cool: z.boolean().optional(),
  therapist: z.boolean().optional(),
  n_tokens: z.number().optional(),
  affiliate: z.string().optional(),
  ai_ran: z.boolean().optional(),
  last_books: dateSchema.optional(), // timestamp with time zone,
  last_influencers: dateSchema.optional(), // timestamp with time zone,
  habitica_user_id: z.string().optional(),
  habitica_api_token: z.string().optional()
})
export type User = z.infer<typeof User>

export const WsConnection = z.object({
  connection_id: z.string(),
  user_id: User.shape.id
})
export type WsConnection = z.infer<typeof WsConnection>


