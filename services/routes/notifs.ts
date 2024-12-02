import {FnContext} from "./types";
import * as S from '@gnothi/schemas'

export async function notifs_shares_list_request(data: any, ctx: FnContext) {
  return await ctx.m.notifs.getShareNotifs()
}

export async function notifs_groups_list_request(data: any, ctx: FnContext) {
  return await ctx.m.notifs.getGroupNotifs()
}

export async function notifs_notes_list_request(data: any, ctx: FnContext) {
  return await ctx.m.notifs.getNoteNotifs()
}

export async function notifs_shares_seen_request(data: S.Notifs.NotifId, ctx: FnContext) {
  await ctx.m.notifs.seenShare(data.id)
  return await ctx.m.notifs.getShareNotifs()
}

export async function notifs_groups_seen_request(data: S.Notifs.NotifId, ctx: FnContext) {
  await ctx.m.notifs.seenGroup(data.id)
  return await ctx.m.notifs.getGroupNotifs()
}

export async function notifs_notes_seen_request(data: S.Notifs.NotifId, ctx: FnContext) {
  await ctx.m.notifs.seenNote(data.id)
  return await ctx.m.notifs.getNoteNotifs()
}
