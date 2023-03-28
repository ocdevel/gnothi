import {Base} from './base'
import {GnothiError} from "../../routes/errors";
import * as S from '@gnothi/schemas'
import {boolMapToKeys} from '@gnothi/schemas/utils'
// @ts-ignore
import dayjs from "dayjs";
import {db} from "../dbSingleton";
import {entries_list_response} from '@gnothi/schemas/entries'
import {sql} from "drizzle-orm/sql"
import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';
import {users, User} from '../schemas/users'
import {shares, sharesUsers} from '../schemas/shares'


export class Users extends Base {
  // async snoop(viewer: User, share_id?: string): Promise<[User, boolean]> {
  //   const vid = viewer.id
  //   if (!share_id || vid === share_id) {
  //     return [viewer, false]
  //   }
  //   const res = await this.db.drizzle.select({
  //     user: users,
  //     share: shares
  //   })
  //     .from(users)
  //     .innerJoin(shares, eq(users.id, shares.))
  //     .innerJoin(sharesUsers, and(
  //       eq(shares.id, sharesUsers.share_id),
  //       eq(shares.user_id, share_id),
  //       eq(sharesUsers.obj_id, vid)
  //     ))
  // }
}
