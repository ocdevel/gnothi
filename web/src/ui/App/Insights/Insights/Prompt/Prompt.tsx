import React, {useState, useEffect, useCallback} from 'react'
import Locked from './Locked.tsx'
import Unlocked, {UnlockedProps} from './Unlocked.tsx'

import {useStore} from "../../../../../data/store";

export default function Prompt(props: UnlockedProps) {
  const me = useStore(s => s.user?.me)
  if (!me?.id) {return null}
  if (me.premium) {
    return <Unlocked {...props} />
  }
  return <Locked />
}


