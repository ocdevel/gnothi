import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {db} from "../dbSingleton";
import {entries_list_response} from '@gnothi/schemas/entries'
import {sql} from "drizzle-orm"
import { and, asc, desc, eq, or } from 'drizzle-orm';
import {users, User} from '../schemas/users'
import {people, Person} from '../schemas/people'
import {shares, sharesUsers, Share} from '../schemas/shares'
import {DB} from "../db";
import {FnContext} from "../../routes/types";

/**
 * Each model has its own snooping capabilities, but this snoop() function is the top-level
 * check which determines if the user is snooping, and if so load the snooped user. The only
 * access-check here is if the user can snoop generally (there's a connecting share). Fine-grained
 * permissions are checked later in each model.
 */
export class Users extends Base {
  people?: Person[]
  async snoop(): Promise<Pick<FnContext, 'viewer' | 'snooping'>> {
    // TODO why would vid == share_id? What is share_id? I need to revisit this
    const [db, viewer, share_id] = [this.context.db, this.context.user, this.context.vid]
    const vid = viewer.id
    if (!share_id || vid === share_id) {
      return {snooping: false, viewer: {user: viewer}}
    }

    const res = await db.drizzle.select({
      user: users,
      share: shares
    })
      .from(users)
      .innerJoin(shares, eq(shares.user_id, share_id))
      .innerJoin(sharesUsers, and(
        eq(shares.id, sharesUsers.share_id),
        eq(sharesUsers.obj_id, vid)
      ))
    return {snooping: true, viewer: res[0]}
  }
  
  async lastCheckin() {
    const {db} = this.context
    const res = await db.drizzle.execute(sql`
      select extract(
        epoch FROM (now() - max(updated_at))
      ) / 60 as mins
      from ${users} limit 1
    `)
    return res.rows[0].mins || 99
  }
  
  async tz(userId: string) {
    const {drizzle} = this.context.db
    const res = await drizzle.execute(sql`
      select coalesce(timezone, 'America/Los_Angeles') as tz
      from ${users} where id=${userId}
    `)
    return res.rows[0].tz
  }
  
  async profileToText(): Promise<string> {
    const {drizzle} = this.context.db
    // TODO consider removing this, very old and weird.
    let txt: string = ''
    const profile = this.context.viewer.user
    if (profile.gender) {
      txt += `I am ${profile.gender}. `
    }
    if (profile.orientation && !/straight/i.test(profile.orientation)) {
      txt += `I am ${profile.orientation}. `
    }
    if (profile.bio) {
      txt += profile.bio
    }
    // load cached people if previously-loaded.
    if (!this.people) {
      this.people = await drizzle.select().from(people).where(eq(people.user_id, profile.id)).execute()
    }
    for (const p of this.people) {
      const whose: string = p.relation.split(' ')[0].includes("'") ? '' : 'my ';
      txt += `${p.name} is ${whose}${p.relation}. `;

      if (p.bio) {
        txt += p.bio;
      }

      // if (p.issues) {
      //     txt += `${p.name} has these issues: ${p.issues} `;
      // }
    }
    txt = txt.replace(/\s+/g, ' ');
    // console.log(txt);
    return txt;
  }
}
