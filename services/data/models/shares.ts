import {Base} from './base'
import {DB} from '../db'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm"
import {users} from '../schemas/users'
import {shares, sharesTags, sharesUsers, Share} from '../schemas/shares'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import { and, asc, desc, eq, or, inArray } from 'drizzle-orm';
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {GnothiError} from "../../routes/errors.js";
import {shares_emailcheck_response} from "../../../schemas/shares.js";

export class Shares extends Base {
  shareFields(profile=true, share=true) {
    let res: string[] = []
    if (profile) {
      res.push(...'email username first_name last_name gender orientation birthday timezone bio'.split(" "))
    }
    if (share) {
      res.push(...'fields books'.split(" "))
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

  async egress() {
    const {vid, db} = this.context
    const {drizzle} = db

    const usersSq = drizzle.$with('usersSq').as(drizzle
      .select({email: users.email, share_id: sharesUsers.share_id})
      .from(sharesUsers)
      .innerJoin(users, eq(users.id, sharesUsers.obj_id))
    )
    const res = await drizzle.with(usersSq)
      .select({
        share: shares,
        tags: sql`array_agg(${sharesTags.tag_id})`.as('tags'),
        users: sql`array_agg(${usersSq.email})`.as('users'),
        // TODO groups
      })
      .from(shares)
      .where(eq(shares.user_id, vid))
      .leftJoin(sharesTags, eq(sharesTags.share_id, shares.id))
      .leftJoin(usersSq, eq(usersSq.share_id, shares.id))
      .groupBy(shares.id)
    return res.map(DB.removeNull)
  }

  async post(req: S.Shares.shares_post_request): Promise<Share> {
    const {vid, db} = this.context
    const {drizzle} = db
    const postReq = {
      ...req.share,
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

    const tids = boolMapToKeys(req.tags)
    await drizzle.delete(sharesTags).where(eq(sharesTags.share_id, sid))
    await drizzle.insert(sharesTags).values(tids.map(t => ({share_id: sid, tag_id: t})))

    const emails = boolMapToKeys(req.users)
    await drizzle.delete(sharesUsers).where(eq(sharesUsers.share_id, sid))
    const uids = (
      await drizzle.select([users.email]).from(users).where(inArray(users.email, emails))
    ).map(r => r.email)
    await drizzle.insert(sharesUsers).values(uids.map(u => ({share_id: sid, obj_id: u})))

    // TODO groups

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
