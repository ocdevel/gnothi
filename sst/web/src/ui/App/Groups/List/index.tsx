import Edit from "../View/Edit";
import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useStore} from "../../../../data/store"
import {FaPlus, FaRegComments} from "react-icons/fa";
import {timeAgo} from "../../../../utils/utils";
import ReactMarkdown from "react-markdown";
import {FaUsers} from "react-icons/fa";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Modal from './Modal'
import Pay from './Pay'

export default function List() {
  const groups = useStore(s => s.res.groups_list_response)
  const [showCreate, setShowCreate] = useState(false)
  const [showGroup, setShowGroup] = useState(null)
  const ee_toolbar_groups_create = useStore(s => s.ee.toolbar_groups_create)

  useEffect(() => {
    console.log('show')
    setShowCreate(ee_toolbar_groups_create)
    // EE.on("toolbar/groups/create", () => setShowCreate(true))
    // return () => EE.off("toolbar/groups/create")
  }, [ee_toolbar_groups_create])

  if (!groups?.ids?.length) {return null}
  const {ids, hash} = groups

  function close() {setShowGroup(null)}

  function renderGroup(gid: string) {
    const g = hash[gid]
    if (!g) {return null}
    return <div key={gid}>
      <Card className='mb-2 cursor-pointer' onClick={() => setShowGroup(gid)}>
        <CardContent>
          <CardHeader title={g.title} />
          <div><FaUsers /> {g.n_members} members</div>
          <div>
            <span><FaRegComments /> {g.n_messages} messages</span>
            <small className='muted ml-2'>({timeAgo(g.last_message)})</small>
          </div>
          <hr />
          <div className='text-muted'>{g.text_short}</div>
        </CardContent>
      </Card>
    </div>
  }

  return <div>
    <Pay />
    {showGroup && <Modal show={true} close={close} gid={showGroup} />}
    <Edit
      close={() => setShowCreate(false)}
      show={showCreate}
    />
    {ids.map(renderGroup)}
  </div>
}
