import React, {useEffect, useCallback, useState, FC, memo} from 'react'
import {Amplify, Auth} from 'aws-amplify'
import {awsConfig} from '../../utils/config'
import {useStore} from '../../data/store'
import {Authenticator, useAuthenticator, Theme, useTheme, ThemeProvider, CheckboxField} from "@aws-amplify/ui-react";
import {theme as muiTheme} from '../Setup/Mui'
import Typography from '@mui/material/Typography'
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import "@aws-amplify/ui-react/styles.css";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

Amplify.configure(awsConfig);

interface AuthComponentOld {
  tab: "signIn" | "signUp" | undefined
}
export function AuthComponentOld({tab}: AuthComponent) {
  // https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
  // https://ui.docs.amplify.aws/react/theming#design-tokens
  // TODO customize colors / fonts
  // 177a5482 - sample theme

  // return <ThemeProvider theme={theme}>
  return <Authenticator
    loginMechanisms={["email"]}
    initialState={tab}
  />
  // return <Authenticator loginMechanisms={loginMechanisms}>
  //     {({ signOut, user }) => {
  //       return <Typography>Welcome ${user.username}</Typography>
  //     }}
  // </Authenticator>
}


Amplify.configure(awsConfig);

interface AuthComponentProps {
  tab: "signIn" | "signUp" | undefined;
}

export const AuthComponent: FC<AuthComponentProps> = ({tab}) => {
  const {validationErrors} = useAuthenticator();
  const [step, setStep] = useState(1);
  const [checked, setChecked] = useState({
    terms: false,
    privacy: false,
    all: false // this means both the above are checked, AND the user has clicked the final next button
  })

  function renderAcknowledge(name: 'terms' | 'privacy', label: string) {
    // errorMessage={validationErrors[name] as string}
    // hasError={!!validationErrors[name]}

    return <FormControlLabel
      control={<Checkbox
        checked={checked[name]}
        onChange={(e) => setChecked({...checked, [name]: e.target.checked})}
      />}
      label={label}
    />
  }

  function signUpSteps() {
    if (step === 1) {
      return <Stack spacing={2}>
        {/* TODO: Insert your disclaimer here */}
        <Typography variant='h4'>Disclaimer</Typography>
        <Typography>Gnothi is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical or mental health emergency, immediately contact a healthcare professional or dial 911. Use of our services is at your own risk. Our platform doesn't provide medical care, and health advice should be sought from licensed professionals. You are solely responsible for seeking appropriate treatment.</Typography>
        {renderAcknowledge("terms", "I agree with the Terms & Conditions")}
        <Button
          variant="contained"
          fullWidth
          disabled={!checked.terms}
          onClick={() => setStep(2)}
        >Next</Button>
      </Stack>
    }
    if (step === 2) {
      return <Stack spacing={2}>
        {/* TODO: Insert your disclaimer here */}
        <Typography variant='h4'>Privacy</Typography>
        <Typography>Privacy policy stuff</Typography>
        {renderAcknowledge("privacy", "I agree with the Privacy Policy")}
        <Button
          variant="contained"
          fullWidth
          disabled={!checked.privacy}
          onClick={() => {
            setStep(3)
            setChecked({...checked, all: true})
          }}
        >Next</Button>
      </Stack>
    }
  }

  if (tab === "signUp" && !checked.all) {
    return signUpSteps()
  }

  return <>
    <Authenticator
      loginMechanisms={["email"]}
      initialState={tab}
    />
  </>
}


export function AuthChecker() {
  // const authenticator = useAuthenticator((context) => [context.user, context.authStatus]);
  const {authStatus} = useAuthenticator((context) => [context.authStatus])

  async function handleChange(authStatus: string) {
    console.log({authStatus})
    const state = useStore.getState()
    if (authStatus === "authenticated") {
      const sess = await Auth.currentSession()
      const jwt = sess.getIdToken().getJwtToken()
      state.setJwt(jwt)
    } else if (state.jwt) {
      // TODO will this trigger if re-authenticating, refreshing jtw, etc?
      state.setJwt(undefined)
    }
  }

  useEffect(() => {
    handleChange(authStatus)
  }, [authStatus])

  return null
}

export function AuthProvider({children}: React.PropsWithChildren) {
  return <Authenticator.Provider>
    <AuthChecker />
    {children}
  </Authenticator.Provider>
}
