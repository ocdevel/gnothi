import {z} from 'zod'
import {IdCol, dateCol, Passthrough} from './utils'
import {Route}  from './api'
import {v4 as uuid} from "uuid";
import * as Users from './users'
export * as Groups from './groups'

import {GroupsSelect, GroupsInsert, groups} from "../services/data/schemas/groups";
import {createSelectSchema} from "drizzle-zod";

// TODO figure out how to pull these via drizzle-zod from db schema. Getting typescript errors
// every way I spin it (something about hard-coded arrays vs dynamic arrays)
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

export const Group = createSelectSchema(groups)
export type Group = z.infer<typeof Group>

export const groups_post_request = Group.pick({
  title: true,
  text_short: true,
  text_long: true,
  privacy: true,
  perk_member: true,
  perk_member_donation: true,
  perk_entry: true,
  perk_entry_donation: true,
  perk_video: true,
  perk_video_donation: true,
})

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
  groups_post_request: {
    i: {
      e: "groups_post_request",
      s: groups_post_request,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      e: "groups_post_response",
      event_as: "groups_list_response",
      s: Group,
      t: {ws: true},
    }
  },
  groups_join_request: {
    i: {
      e: "groups_join_request",
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: "groups_join_response",
      event_as: "groups_list_response",
      s: Group,
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
