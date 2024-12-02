import {Base} from './base'
import {GnothiError, GroupDenied} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {db} from "../dbSingleton";
import {CREDIT_MINUTES} from '@gnothi/schemas/users'
import {inArray, ne, sql} from "drizzle-orm"
import { and, asc, desc, eq, or } from 'drizzle-orm';
import {users, User} from '../schemas/users'
import {people, Person} from '../schemas/people'
import {shares, sharesUsers, Share} from '../schemas/shares'
import {DB} from "../db";
import {FnContext} from "../../routes/types";
import {Logger} from "../../aws/logs";
import {groups, groupsUsers} from "../schemas/groups.js";
import {ulid} from "ulid";

export class Groups extends Base {

  async list() {
    const {db: {drizzle}} = this.context
    return drizzle
      .select()
      .from(groups)
      // TODO handle matchable
      .where(eq(groups.privacy, "public"))
  }

  async get(gid: string) {
    const {db: {drizzle}} = this.context
    return drizzle.select().from(groups).where(eq(groups.id, gid))
  }

  async checkAccess(gid: string, roles = []) {
    const {uid, db: {drizzle}} = this.context
    const rows = await drizzle
      .select({role: groupsUsers.role})
      .from(groupsUsers)
      .where(
        and(
          eq(groupsUsers.user_id, uid),
          eq(groupsUsers.group_id, gid),
          ne(groupsUsers.role, "banned"),
          ...(roles.length ? [inArray(groupsUsers.role, roles)] : [])
        )
      )
    if (!rows.length) {
      throw new GroupDenied()
    }
  }

  async listMine() {
    const {uid, db: {drizzle}} = this.context
    const rows = await drizzle
      .select()
      .from(groups)
      .innerJoin(groupsUsers, eq(groupsUsers.group_id, groups.id))
      .where(
        and(
          eq(groupsUsers.user_id, uid),
          ne(groupsUsers.role, "banned")
        )
      )
    const justGroups = rows.map(r => ({
      ...r.groups,
      role: r.groups_users.role,
    }))
    return justGroups
  }

  async join(gid: string) {
    const {uid, db: {drizzle}} = this.context
    // FIXME move to models file
    // FIXME reference old python code, ensure nothing missing
    // FIXME add petname
    const alreadyJoined = await drizzle.select().from(groupsUsers).where(
      and(
        eq(groupsUsers.group_id, gid),
        eq(groupsUsers.user_id, uid)
      )
    )
    if (alreadyJoined.length) {
      throw new GnothiError({
        // key: "ALREADY_JOINED", // FIXME factor this into system
        code: 400,
        message: "You've already joined this group"
      })
    }
    const groupUser = await drizzle
      .insert(groupsUsers)
      .values({
        group_id: gid,
        user_id: uid,
        username: ulid()
      })
      .returning()

    // TODO consider Promise.all this with groupsUser above; there'd be a race-condition depending on which hit first,
    // and this is handy to actually re-calculate rather than +/-1 (just in case)
    await drizzle.execute(sql`
      UPDATE groups g 
      SET n_members=(SELECT count(*) FROM users_groups ug WHERE ug.group_id=${gid} AND ug.role != 'banned')
      WHERE g.id=${gid}
    `)
    return groupUser
  }

  async listMembers(gid: string) {
    return []
    // TODO convert the following python + sqlalchemy to node + drizzle-orm
    // share = (db.query(Share).join(ShareGroup, sa.and_(
    //     ShareGroup.obj_id == gid,
    //     ShareGroup.share_id == Share.id
    // )).subquery())
    // share = orm.aliased(Share, share)
    // rows = (
    //     db.query(
    //         User,
    //         UserGroup,
    //         share
    //     )
    //     .select_from(UserGroup).filter(UserGroup.group_id == gid)
    //     .join(User)
    //     .outerjoin(share)
    //     .all())
    // rows = [dict(user=r[0], user_group=r[1], share=r[2]) for r in rows]
    // return Share.merge_shares(rows)
  }

  async snoop(gid: string): Promise<Pick<FnContext, 'viewer' | 'snooping'>> {
    const [db, viewer] = [this.context.db, this.context.user]
    const vid = viewer.id

    const res = await db.drizzle.select({
      group: groups,
      groupUser: groupsUsers,
      share: shares
    })
      .from(groups)
      .leftJoin(groupsUsers, and(
        eq(groupsUsers.group_id, gid),
        eq(groupsUsers.user_id, vid),
        ne(groupsUsers.role, 'banned')
      ))
      .leftJoin(shares, and(
        eq(shares.obj_id, gid),
        eq(shares.obj_type, 'group')
      ))
      .where(eq(groups.id, gid))

    if (!res.length) {
      return {snooping: false, viewer: {user: viewer}}
    }

    const {group, groupUser, share} = res[0]

    // Check if user is a member or has accepted share
    const isMember = !!groupUser
    const hasAcceptedShare = share && await db.drizzle.select()
      .from(sharesUsers)
      .where(and(
        eq(sharesUsers.share_id, share.id),
        eq(sharesUsers.obj_id, vid),
        eq(sharesUsers.state, 'accepted')
      ))
      .then(rows => rows.length > 0)

    if (!isMember && !hasAcceptedShare) {
      return {snooping: false, viewer: {user: viewer}}
    }

    // Apply group permissions based on privacy settings and role
    const sanitizedGroup = this.applySharingPermissions(group, groupUser?.role || 'viewer')
    return {
      snooping: !isMember,
      viewer: {
        user: viewer,
        group: sanitizedGroup,
        role: groupUser?.role || 'viewer'
      }
    }
  }

  private applySharingPermissions(group: any, role: string): any {
    const sanitizedGroup = {...group}
    
    // Define viewable fields based on role
    const rolePermissions = {
      owner: ['*'],
      admin: ['*'],
      moderator: ['id', 'name', 'description', 'privacy', 'created_at', 'updated_at', 'members', 'posts'],
      member: ['id', 'name', 'description', 'privacy', 'created_at', 'members'],
      viewer: ['id', 'name', 'description', 'privacy']
    }

    // Get allowed fields for role
    const allowedFields = rolePermissions[role] || rolePermissions.viewer
    
    // If role has all permissions, return full group
    if (allowedFields.includes('*')) {
      return sanitizedGroup
    }

    // Filter out non-allowed fields
    Object.keys(sanitizedGroup).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete sanitizedGroup[key]
      }
    })

    return sanitizedGroup
  }
}
