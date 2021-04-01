import CreateGroup from "./CreateGroup";
import React, {useState} from "react";
import {Button, Card} from "react-bootstrap";
import {Link} from "react-router-dom";
import {useStoreState} from "easy-peasy";


export default function AllGroups() {
  const groups = useStoreState(s => s.ws.data['groups/mine/get'])
  const [showCreate, setShowCreate] = useState(false)
  return <div>
    <CreateGroup close={() => setShowCreate(false)} show={showCreate}/>
    <Card className='border-0'>
      <Card.Header>
        <span>
          Groups
        </span>
        <Button
          variant='link'
          size='sm'
          className='float-right p-0'
          onClick={() => setShowCreate(true)}
        >Create Group</Button>
      </Card.Header>
      <Card.Body>
        {groups.map((g, i) => <div key={g.id}>
          <Card.Subtitle className='mb-2'>
            <Link to={`/groups/${g.id}`}>{g.title}</Link>
          </Card.Subtitle>
          <div className='text-muted'>{g.text_short}</div>
          {i < groups.length - 1 && <hr />}
        </div>)}
      </Card.Body>
    </Card>
  </div>
}
