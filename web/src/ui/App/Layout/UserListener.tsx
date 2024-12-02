import * as React from 'react';
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect, useCallback} from "react";
import {shallow} from "zustand/shallow";
import * as S from '@gnothi/schemas'
import dayjs from "dayjs";
import {tz as momentTz} from 'moment-timezone'
import {users_list_response} from "../../../../../schemas/users.ts";
const tznames = momentTz.names()


export default function UserListener() {
  const [
    send,
    setUser,
    as,
  ] = useStore(useCallback(s => [
    s.send,
    s.setUser,
    s.user?.as,
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

  // listen to changes across me, as, and users-list.
  useEffect(() => {
    // only set user/viewer when pre-requisites are present
    const user = users?.[whoami?.uid]
    if (!user) {return}

    ensureTimezone(user)
    setUser({
      me: users[whoami.uid],
      viewer: as ? users[as] : users[whoami.uid],
      as
    })
  }, [whoami, users, as, setUser])

  // Trigger data refresh when switching users
  useEffect(() => {
    if (as !== undefined) {
      // Only fetch the essential data needed for viewing another user
      // This prevents clobbering UserB's data when viewing UserA
      send('entries_list_request', {as})
      send('tags_list_request', {as})
      send('fields_list_request', {as})
    }
  }, [as, send])

  return null
}
