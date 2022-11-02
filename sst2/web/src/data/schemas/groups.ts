import {z} from 'zod'
import {idCol, dateCol, def, Passthrough} from './utils'
import {v4 as uuid} from "uuid";
import * as Users from './users'
export * as Groups from './groups'

export const GroupPrivacy = z.enum([
  'public',
  'matchable',
  'private'
]).default("public")

export const GroupRoles = z.enum([
  'member',
  'owner',
  'admin',
  'banned'
]).default("member")

export const Group = z.object({
  id: idCol(),
  owner_id: idCol(), // users.id
  title: z.string(),
  text_short: z.string(),
  text_long: z.string().optional(),
  privacy: GroupPrivacy,
  official: z.boolean().default(false),
  created_at: dateCol(),
  updated_at: dateCol(),

  n_members: z.number().default(1),
  n_messages: z.number().default(0),
  last_message: dateCol(),
  owner_name: z.string().optional(),

  perk_member: z.number().default(0),
  perk_member_donation: z.boolean().default(false),
  perk_entry: z.number().default(0),
  perk_entry_donation: z.boolean().default(false),
  perk_video: z.number().default(0),
  perk_video_donation: z.boolean().default(false),
})
export type Group = z.infer<typeof Group>

export const groups_get_response = Group
export type groups_get_response = z.infer<typeof groups_get_response>
export const groups_mine_list_response = Group
export type groups_mine_list_response = z.infer<typeof groups_mine_list_response>
export const groups_list_response = Group
export type groups_list_response = z.infer<typeof groups_list_response>


export const UserGroup = z.object({
  user_id: idCol(),
  group_id: idCol(),

  username: z.string().default("GeneratedName"),
  joined_at: dateCol(),
  role: GroupRoles,
})
export type UserGroup = z.infer<typeof UserGroup>

export const groups_members_list_response = z.object({
  user: Users.User,
  user_group: UserGroup,
  share: z.object({}).passthrough().optional()
})
export type groups_members_list_response = z.infer<typeof groups_members_list_response>

export const routes = {
  groups_list_request: def({
    eventIn: 'groups_list_request',
    eventOut: 'groups_list_response',
    schemaIn: z.object({}),
    schemaOut: Group,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  groups_list_response: null,
  groups_get_request: def({
    eventIn: 'groups_get_request',
    eventOut: 'groups_get_response',
    schemaIn: z.object({}),
    schemaOut: Group,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  groups_get_response: null,
  groups_enter_request: def({
    eventIn: 'groups_enter_request',
    eventOut: 'groups_enter_response',
    schemaIn: Passthrough,
    schemaOut: Passthrough,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  })
}

export const GroupMessage = z.object({
  id: idCol(),
  user_id: idCol(),
  obj_id: idCol(), // groups.id
  created_at: dateCol(),
  updated_at: dateCol(),
  text: z.string()
})


const group1 = Group.parse({
  id: uuid(),
  owner_id: Users.fakeData.self.id,
  title: "Gnothi Group",
  text_short: "A group for Gnothi users",
  text_long: "A group for Gnothi users. This is a long description.",
  privacy: "public",
  official: true,
})
const memberRaw = groups_members_list_response.parse({
  user: Users.fakeData.self,
  user_group: UserGroup.parse({
    user_id: Users.fakeData.self.id,
    group_id: group1.id,
    username: "lefnire"
  }),
  share: {}
})
const memberMod = {
  user: {...memberRaw.user, display_name: "uname_modified"},
  user_group: {...memberRaw.user_group, online: true, role: "member"},
}
export const fakeData = {
  all: [
    group1
  ],
  gnothi: group1,
  mine: [
    group1
  ],
  members: [
    memberMod
  ]
}
