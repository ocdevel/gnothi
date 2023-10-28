import * as React from 'react';
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect, useCallback} from "react";
import {shallow} from "zustand/shallow";
import * as S from '@gnothi/schemas'
import dayjs from "dayjs";
import {tz as momentTz} from 'moment-timezone'
import {CREDIT_MINUTES, users_list_response} from "../../../../../schemas/users.ts";
const tznames = momentTz.names()


export default function UserListener() {
  const [
    send,
    setUser,
    creditActivate
  ] = useStore(useCallback(s => [
    s.send,
    s.setUser,
    s.creditActivate
  ], []))
  const [whoami, users] = useStore(s => [
    s.res.users_whoami_response?.first,
    s.res.users_list_response?.hash
  ], shallow)

  function ensureTimezone(user: S.Users.User) {
    // if user has no timezone, set it. Vital for behaviors especially. They can manually set it in profile

    // account for null, "null" (bug I can't find), and anything else.
    if (!tznames.includes(user.timezone)) {
      // Guess their default timezone (TODO should call this out?)
      const timezone = dayjs.tz.guess()
      send("users_put_request", {timezone})
    }
  }

  // listen to changes across, me, as, and users-list.
  useEffect(() => {
    // only set user/viewer when pre-requisites are present. Also returns if this user-list doesn't contain updates
    // to user (need to account for viewer)
    const user = users?.[whoami?.uid]
    if (!user) {return}

    ensureTimezone(user)
    setUser({
      me: users[whoami.uid],
      viewer: users[whoami.vid],
      as: null
    })

    // restore the fact they have an active credit on refresh
    creditActivate(user)

    // TODO handle as switch
    // if (viewer.asId && hash[viewer.asId]) {
    //   get().send('users_everything_request', {})
    // }
  }, [whoami, users])
  return null
}
