import {useEffect} from "react";
import Typography from "@mui/material/Typography";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import {useStore} from "../../../../data/store";
import {useShallow} from "zustand/react/shallow";

export default function Inbound() {
  const [
    send,
    ingressShares,
  ] = useStore(useShallow(s => [
    s.send,
    s.res.shares_ingress_list_response?.rows || [],
  ]))

  useEffect(() => {
    send('shares_ingress_list_request', {})
  }, [])

  const handleAccept = (id: string) => {
    send('shares_accept_request', {id})
  }

  const handleReject = (id: string) => {
    send('shares_reject_request', {id})
  }

  return (
    <>
      <Typography variant="h5">Shared With Me</Typography>
      <List>
        {ingressShares.map(share => (
          <ListItem key={share.id}>
            <ListItemText 
              primary={share.user.email}
              secondary={
                <>
                  {share.share.username && "Username"}
                  {share.share.email && ", Email"}
                  {share.share.first_name && ", First Name"}
                  {share.share.last_name && ", Last Name"}
                  {share.share.bio && ", Bio"}
                  {share.share.fields && ", Fields"}
                </>
              }
            />
            {share.state === 'pending' && (
              <>
                <Button onClick={() => handleAccept(share.id)} color="primary">
                  Accept
                </Button>
                <Button onClick={() => handleReject(share.id)} color="secondary">
                  Reject
                </Button>
              </>
            )}
          </ListItem>
        ))}
      </List>
    </>
  );
}
