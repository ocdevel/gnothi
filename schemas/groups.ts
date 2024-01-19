import {z} from 'zod'
import {IdCol, dateCol, Passthrough} from './utils'
import {Route}  from './api'
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
  id: IdCol,
  owner_id: IdCol, // users.id
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
  user_id: IdCol,
  group_id: IdCol,

  username: z.string().default("GeneratedName"),
  joined_at: dateCol(),
  role: GroupRoles,
})
export type UserGroup = z.infer<typeof UserGroup>


// TODO added _ at end to indicate this isn't a DB table, revisit
export const GroupMember_ = z.object({
  user: Users.User,
  user_group: UserGroup,
  share: z.object({}).passthrough().optional()
})
export type GroupMember_ = z.infer<typeof GroupMember_>

export const GroupMessage = z.object({
  id: IdCol,
  user_id: IdCol,
  obj_id: IdCol, // groups.id
  created_at: dateCol(),
  updated_at: dateCol(),
  text: z.string()
})

// export const GroupNotif = NotifCommon


export const routes = {
  groups_list_request: {
    i: {
      e: 'groups_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'groups_list_response',
      s: Passthrough,
      t: {ws: true},
    }
  },
  groups_get_request: {
    i: {
      e: 'groups_get_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'groups_get_response',
      s: Group,
      t: {ws: true},
    }
  },
  groups_enter_request: {
    i: {
      e: 'groups_enter_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'void',
      s: Passthrough,
      t: {ws: true},
    }
  },
  groups_members_list_request: {
    i: {
      e: 'groups_members_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'groups_members_list_response',
      s: GroupMember_,
      t: {ws: true},
      keyby: 'users.id',
    }
  },
  groups_mine_list_request: {
    i: {
      e: 'groups_mine_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'groups_mine_list_response',
      s: Group,
      t: {ws: true},
    }
  },
}
