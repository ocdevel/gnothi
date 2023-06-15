import React, {useState} from "react";
import Entry from "../../Entries/View";
import Teaser from "../../Entries/List/Teaser";
import {useStore} from '../../../../data/store'
import {Loading} from "../../../Components/Routing";

export default function Entries() {
  const entries = useStore(s => s.res.groups_entries_list_response_debounce)
  const [eid, setEid] = useState<string | null>(null)

  if (!entries?.ids?.length) {
    return <Loading label="groups_entries_list_response" />
  }
  const {ids, hash} = entries

  const onOpen = (id: string) => setEId(id)
  const close = () => setEid(null)

  // return <Card className='group-entries'>
  return <>
    {eid && <Entry entry={hash[eid]} close={close} />}
    {ids.map(eid => <Teaser eid={eid} gotoForm={onOpen} key={eid}/> )}
  </>
}
