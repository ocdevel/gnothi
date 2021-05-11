import {useStoreActions, useStoreState} from "easy-peasy";
import React, {useEffect, useState} from "react";
import {FaTrash} from "react-icons/fa";
import {EE} from '../../redux/ws'
import {trueKeys} from "../../Helpers/utils";
import Error from "../../Error";
import {Grid, Button, FormHelperText, Typography, Chip} from '@material-ui/core'
import {TextField2, makeForm, yup} from "../../Helpers/Form";

const emailSchema = yup.object().shape({
  email: yup.string().email().required(),
})
const useForm = makeForm(emailSchema, {email: ''})

export default function Users({users, setUsers}) {
  const emit = useStoreActions(a => a.ws.emit)
  const checked = useStoreState(s => s.ws.data['shares/email/check']?.email)
  const form = useForm()

  useEffect(() => {
    const email = form.getValues('email')
    if (checked && checked === email) {
      setUsers({...users, [email]: true})
      form.reset({email: ""})
    }
  }, [checked])

  const removeUser = email => () => {
    setUsers({...users, [email]: false})
  }

  function submit(form) {
    emit(['shares/email/check', form])
  }

  function renderUsers() {
    const arr = trueKeys(users)
    if (!arr.length) {return null}
    return <>
      {arr.map(a => <Chip
        key={a}
        label={a}
        variant="outlined"
        onDelete={removeUser(a)}
      />)}
    </>
  }

  return <form onSubmit={form.handleSubmit(submit)}>
    <Typography variant='button'>People</Typography>
    <Grid container spacing={2} justifyContent='center'>
      <Grid item flex={1}>
        <TextField2
          name='email'
          type='email'
          label='Email address'
          size='small'
          form={form}
        />
      </Grid>
      <Grid item>
        <Button variant='contained' color='primary' type='submit'>Add</Button>
      </Grid>
    </Grid>
    <FormHelperText>
      Email of person you'll share data with. If they're not on Gnothi, have them sign up first.
    </FormHelperText>
    <Error action={/shares\/email\/check/g} codes={[400, 404]} />
    {renderUsers()}
  </form>
}
