import {Base} from './base'
import {db} from '../dbSingleton'
import * as S from '@gnothi/schemas'
import {sql} from "drizzle-orm/sql"
import {users} from '../schemas/users'
import {shares, sharesTags, sharesUsers, Share} from '../schemas/shares'
import {fields} from '../schemas/fields'
import {fieldEntries} from '../schemas/fieldEntries'
import { and, asc, desc, eq, or, inArray } from 'drizzle-orm/expressions';
import {boolMapToKeys} from '@gnothi/schemas/utils'

export class Shares extends Base {
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
    return res.map(db.removeNull)
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

}
