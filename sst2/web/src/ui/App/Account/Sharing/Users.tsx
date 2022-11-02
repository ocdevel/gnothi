import {useStore} from "@gnothi/web/src/data/store"
import React, {useEffect} from "react";
import {trueKeys} from "@gnothi/web/src/utils/utils";
import Error from "@gnothi/web/src/ui/Components/Error";
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import {TextField2, makeForm, yup} from "@gnothi/web/src/ui/Components/Form";

const emailSchema = yup.object().shape({
  email: yup.string().email().required(),
})
const useForm = makeForm(emailSchema, {email: ''})

export default function Users({users, setUsers}) {
  const send = useStore(s => s.send)
  const checked = useStore(s => s.res.shares_emailcheck_response?.first?.email)
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
    send('shares_emailcheck_request', form)
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
    <Error event={/shares\/email\/check/g} codes={[400, 404]} />
    {renderUsers()}
  </form>
}
