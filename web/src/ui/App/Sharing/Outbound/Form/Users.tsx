import {useStore} from "../../../../../data/store/index"
import React, {useCallback, useEffect} from "react";
import {trueKeys} from "@gnothi/web/src/utils/utils";
import Error from "@gnothi/web/src/ui/Components/Error";
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import {TextField2} from "../../../../Components/Form";
import {maxWidth} from "../../../../../tmp/material-ui/packages/mui-system";
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {shallow} from "zustand/shallow";

const emailSchema = z.object({
  email: z.string().email(),
})
type EmailSchema = z.infer<typeof emailSchema>

export default function Users() {
  const [
    checked,
    users,
  ] = useStore(s => [
    s.res.shares_emailcheck_response?.rows?.[0],
    s.sharing.form.users
  ], shallow)
  const [
    send,
    setUsers
  ] = useStore(useCallback(s => [
    s.send,
    s.sharing.form.setUsers
  ], []))

  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {email: ""}
  })

  useEffect(() => {
    if (!checked?.email?.length) {return}
    const email = form.getValues('email')
    if (checked.email === email) {
      setUsers({...users, [email]: true})
      form.reset({email: ""})
    }
  }, [checked])

  function submit(data: EmailSchema) {
    send('shares_emailcheck_request', data)
  }

  function renderUsers() {
    const arr = trueKeys(users)
    if (!arr.length) { return null }
    return (
      <>
        {arr.map(a => <Chip
          key={a}
          label={a}
          variant="outlined"
          onDelete={() => setUsers({...users, [a]: false})}
        />)}
      </>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(submit)}>
      <Typography
        marginTop={4}
        fontWeight={400}
        variant='body1'
      >
        Enter the email of the person you’d like to share with below.
      </Typography>
      <Typography
        variant='body2'
        marginBottom={2}>
        If they're not on Gnothi, have them sign up first.
      </Typography>
      <Grid container direction='column' spacing={2} justifyContent='center'>
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
          <Button size='small' variant='contained' color='secondary' type='submit'>Add</Button>
        </Grid>
      </Grid>
      <Error event={/shares\/email\/check/g} codes={[400, 404]} variant="inline" />
      {renderUsers()}
    </form>
  );

  // return <form onSubmit={form.handleSubmit(submit)}>
  //   <Typography variant='button'>People</Typography>
  //   <Grid container spacing={2} justifyContent='center'>
  //     <Grid item flex={1}>
  //       <TextField2
  //         name='email'
  //         type='email'
  //         label='Email address'
  //         size='small'
  //         form={form}
  //       />
  //     </Grid>
  //     <Grid item>
  //       <Button variant='contained' color='secondary' type='submit'>Add</Button>
  //     </Grid>
  //   </Grid>
  //   <FormHelperText>
  //     Email of person you'll share data with. If they're not on Gnothi, have them sign up first.
  //   </FormHelperText>
  //   <Error event={/shares\/email\/check/g} codes={[400, 404]} variant="inline" />
  //   {renderUsers()}
  // </form>
}
