import {z} from "zod"
import {Passthrough, IdCol, dateCol} from "./utils";
import {Route} from './api'
export * as Auth from './auth'

export const auth_login_request = z.object({
  email: z.string().email().transform(s => s.toLowerCase()),
  password: z.string()
})
export type auth_login_request = z.infer<typeof auth_login_request>

export const auth_login_response = z.object({
  jwt: z.string()
})

export const auth_register_request = z.object({
  email: z.string().email(),
  password: z.string(),
  passwordConfirm: z.string(),
  harness: z.object({
    friend: z.boolean().optional(),
    entries: z.number().optional(),
    tags: z.number().optional(),
    fields: z.number().optional(),
    fieldEntries: z.number().optional(),
  }).or(z.string()).optional()
})
export type auth_register_request = z.infer<typeof auth_register_request>
export const auth_register_response = auth_login_response
export type auth_register_response = z.infer<typeof auth_register_response>


export const routes = {
  auth_login_request: new Route({
    i: {
      s: auth_login_request,
      e: 'auth_login_request',
      t: {http: true},
    },
    o: {
      s: auth_login_response,
      e: 'auth_login_response',
      t: {http: true},
    }
  }),
  auth_register_request: new Route({
    i: {
      s: auth_register_request,
      e: 'auth_register_request',
      t: {http: true},
    },
    o: {
      s: auth_register_response,
      e: 'auth_register_response',
      t: {http: true},
    }
  })
}
