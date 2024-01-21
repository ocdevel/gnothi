import {Routes} from '@gnothi/schemas'
import {DB} from '../../data/db'
import {Route} from '../types'
import {db} from "../../data/dbSingleton.js";
import {groups, groupsUsers} from "../../data/schemas/groups.js";
import {and, eq, ne, sql} from "drizzle-orm";
import {ulid} from "ulid";
import {GnothiError} from "../errors.js";

const r = Routes.routes

export const groups_enter_request = new Route(r.groups_enter_request, async (req, context) => {
  await Promise.all([
    context.handleReq({event: "groups_get_request", data: req}, context),
    context.handleReq({event: "groups_members_list_request", data: req}, context)
  ])
  // d.mgr.exec(d, action='notifs/groups/seen', input=data),
  // d.mgr.exec(d, action='groups/messages/get', input=data),
  // d.mgr.exec(d, action='groups/entries/get', input=data),
  return []
})

export const groups_list_request = new Route(r.groups_list_request, async (req, context) => {
  return context.m.groups.list()
})

export const groups_mine_list_request = new Route(r.groups_mine_list_request, async (req, context) => {
  return context.m.groups.listMine()
})

export const groups_join_request = new Route(r.groups_join_request, async (req, context) => {
  return context.m.groups.join(req.id)
})

export const groups_get_request = new Route(r.groups_get_request, async (req, context) => {
  const {groups} = context.m
  await groups.checkAccess(req.id)
  return groups.get(req.id)

  // TODO handling of broadcast
  // g = d.db.query(M.Group).get(data.id)
  // if uids is True:
  //     uids = M.UserGroup.get_uids(d.db, data.id)
  // return ResWrap(data=g, uids=uids)
})

export const groups_members_list_request = new Route(r.groups_members_list_request, async (req, context) => {
  return []
})