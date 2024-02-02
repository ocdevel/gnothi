import {Base} from './base'
import {DB} from '../db'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm"
import {users} from '../schemas/users'
import {shares, sharesTags, sharesUsers, Share, sharesGroups} from '../schemas/shares'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import { and, asc, desc, eq, or, inArray } from 'drizzle-orm';
import {boolMapToKeys, keysToBoolMap} from '../../../schemas/utils'
import {GnothiError} from "../../routes/errors.js";
import {shares_emailcheck_response, shareProfileFields, shareFeatures} from "../../../schemas/shares";
import {groups} from "../schemas/groups.js";

export class Shares extends Base {
  shareFields(profile=true, share=true) {
    let res: string[] = []
    if (profile) {
      // FIXME are all fields being enabled regardless of client-side form?
      res.push(...shareProfileFields)
    }
    if (share) {
      res.push(...shareFeatures)
    }
    return res
  }

  async ingress() {
    const {vid, db: {drizzle}} = this.context
    const rows = await drizzle
      .select()
      .from(sharesUsers)
      .innerJoin(shares, eq(shares.id, sharesUsers.share_id))
      .innerJoin(users, eq(users.id, shares.user_id))
      .where(eq(sharesUsers.obj_id, vid))
    return this.mergeShares(rows)
  }

  mergeShares(rows) {
    // For a user/group with multiple ingress shares, merge those into their maximum permissions.
    // TODO do this via SQL instead of Python

    // Javascript:
    const sf = this.shareFields()
    const merged = {}
    for (const r of rows) {
      const uid = r['user'].id
      let exists = merged[uid]
      if (!exists) {
        merged[uid] = r
        continue
      }
      exists = exists['share']
      for (const k of sf) {
        const v1 = exists[k]
        const v2 = r['share'][k]
        exists[k] = v1 || v2
      }
    }
    return Object.values(merged)
  }

  async egress(sid?: string) {
    const {vid, db} = this.context
    const d = db.drizzle

    // aggregate shares.* into its json object as a single return column called "share"
    const rows = await d.execute(sql`
      SELECT 
        s.id,
        row_to_json(s) as share,
        array_agg(st.obj_id) AS tags, 
        array_agg(su.email) AS users,
        array_agg(sg.obj_id) AS groups
      FROM shares s
      LEFT JOIN shares_tags st ON st.share_id = s.id
      LEFT JOIN shares_users su ON su.share_id = s.id
      LEFT JOIN shares_groups sg ON su.share_id = s.id
      LEFT JOIN users u ON u.id = su.obj_id
      WHERE s.user_id = ${vid}
      ${sid ? sql`AND s.id = ${sid}` : sql``}
      GROUP BY s.id;
    `)
    debugger
    return rows.map((r) => {
      const {groups, users, tags, ...rest} = r
      return {
        ...rest,
        groups: keysToBoolMap(groups),
        users: keysToBoolMap(users),
        tags: keysToBoolMap(tags),
      }
    })

    // git-blame drizzle native version (non-working attempt)
  }

  async post(req: S.Shares.shares_post_request): Promise<Share> {
    const {vid, db} = this.context
    const {drizzle} = db
    const {share, groups, tags, users} = req
    const postReq = {
      ...share,
      user_id: vid,
    }
    const res = await db.drizzle.insert(shares).values(postReq).returning()
    const putReq = {...req, share: res[0]}
    return this.put(putReq, true)
  }


  async put(req: S.Shares.shares_put_request, isUpsert=false): Promise<Share> {
    const {vid, db} = this.context
    const {drizzle} = db
    const [s, sid] = [req.share, req.share.id]

    if (isUpsert) {
      await drizzle.update(shares).set(s).where(eq(shares.id, sid))
    }

    // delete previous ones. Easier than checking what's false in req, and setting if exists via SQL
    // Use CTE trick because "cannot insert multiple commands into a prepared statement"
    await drizzle.execute(sql`
      WITH deleteTags AS (DELETE FROM shares_tags WHERE share_id=${sid}),
      deleteUsers AS (DELETE FROM shares_users WHERE share_id=${sid})
      DELETE FROM shares_groups WHERE share_id=${sid};
    `)

    let promises: Promise<any>[] = []

    const shareJoin = (id: string) => ({share_id: sid, obj_id: id})

    const sharesTagsIns = boolMapToKeys(req.tags).map(shareJoin)
    if (sharesTagsIns.length) {
      promises.push(drizzle.insert(sharesTags).values(sharesTagsIns))
    }

    const emails = boolMapToKeys(req.users)
    const userRows = await drizzle
      .select({id: users.id})
      .from(users)
      .where(inArray(users.email, emails))
    const sharesUsersIns = userRows.map(r => shareJoin(r.id))
    if (sharesUsersIns.length) {
      promises.push(drizzle.insert(sharesUsers).values(sharesUsersIns))
    }

    const sharesGroupsIns = boolMapToKeys(req.groups).map(shareJoin)
    if (sharesGroupsIns.length) {
      promises.push(drizzle.insert(sharesGroups).values(sharesGroupsIns))
    }

    await Promise.all(promises)

    return this.egress(sid)
  }
  async emailCheck(email: string): Promise<shares_emailcheck_response[]> {
    const {db} = this.context
    const {drizzle} = db
    const rows = await drizzle
      .select({email: users.email})
      .from(users)
      .where(eq(users.email, email))
    if (!rows?.length) {
      throw new GnothiError({code: 404, message: "No Gnothi user with that email. Have them sign up first."})
    }
    return rows
  }

}
