import React, {useEffect, useState} from "react";
import {useStore} from "@gnothi/web/src/data/store"
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import {Alert2} from "@gnothi/web/src/ui/Components/Misc";

export default function Therapists({setShowTherapists}) {
const send = useStore(s => s.send)
  const therapists = useStore(s => s.res['users_therapists_list_response'])

  useEffect(() => {
    send('users_therapists_list_request', {})
  }, [])

  useEffect(() => {
    if (therapists?.length) {
      setShowTherapists(true)
    }
  }, [therapists])

  const renderTherapist = (t) => {
    let name = '';
    if (t.first_name) {name += t.first_name + ' '}
    if (t.last_name) {name += t.last_name + ' '}
    name += t.email
    return <Card>
      <CardHeader title={name} />
      <CardContent>
        <Typography>{t.bio}</Typography>
      </CardContent>
    </Card>
  }

  return <div className='mt-3'>
    <Alert2
      severity='info'
      title="AI-recommended therapists based on your entries."
    >
      <div>AI matches your entries to therapists from their bio & specialties. It's automatic & private, they won't see your data (unless you explicitly share with them under Account {'>'} Sharing).</div>
      <div>If you're a therapist wanting listed, check "therapist" under Account {'>'} Profile.</div>
    </Alert2>
    {therapists?.length ? therapists.map(renderTherapist) : (
      <Alert2 severity='warning'>No therapist matches yet.</Alert2>
    )}
  </div>
}
