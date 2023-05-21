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
import './hide-signup-button.css'
import {create} from "zustand";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {shallow} from "zustand/shallow";
import {BasicDialog} from "../Components/Dialog.tsx";
import DialogContent from "@mui/material/DialogContent";

Amplify.configure(awsConfig);

// Create a Zustand store local to this file to track just the two acknowledgement checkboxes.
type AcksObj = {
  acceptTermsConditionsDisclaimer: Date | null
  acceptPrivacyPolicy: Date | null
}
type AcksKeys = keyof AcksObj
const useLocalStore = create<{
  acks: AcksObj
  setAcks: (acks: Partial<AcksObj>) => void
  done: boolean
  setDone: (done: boolean) => void
}>((set, get) => ({
  acks: {
    acceptTermsConditionsDisclaimer: null,
    acceptPrivacyPolicy: null,
  },
  setAcks: (acks: Partial<AcksObj>) => set({acks: {...get().acks, ...acks}}),
  done: false,
  setDone: (done: boolean) => set({done}),
}))


function Acknowledgements() {
  const [
    acks,
    setAcks,
    done,
    setDone
  ] = useLocalStore(s => [
    s.acks,
    s.setAcks,
    s.done,
    s.setDone
  ], shallow)
  const [step, setStep] = useState<number>(1);

  function nextStep() {
    const newStep = step + 1
    setStep(newStep)
    if (newStep === 3 && acks.acceptPrivacyPolicy && acks.acceptTermsConditionsDisclaimer) {
      setDone(true)
    }
  }

  function renderAcknowledge(name: AcksKeys, label: string) {
    return <>
      <FormControlLabel
        control={<Checkbox
          checked={!!acks[name]}
          onChange={(e) => setAcks({
            ...acks,
            [name]: acks[name] ? null : new Date()
          })}
        />}
        label={label}
      />
      <Button
        variant="contained"
        fullWidth
        disabled={!acks[name]}
        onClick={nextStep}
      >Next</Button>
    </>
  }

  if (step === 1) {
    return <Stack spacing={2}>
      {/* TODO: Insert your disclaimer here */}
      <Typography variant='h4'>Disclaimer</Typography>
      <Typography>Gnothi is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical or mental health emergency, immediately contact a healthcare professional or dial 911. Use of our services is at your own risk. Our platform doesn't provide medical care, and health advice should be sought from licensed professionals. You are solely responsible for seeking appropriate treatment.</Typography>
      {renderAcknowledge("acceptTermsConditionsDisclaimer", "I agree with the Terms & Conditions")}
    </Stack>
  }
  if (step === 2) {
    return <Stack spacing={2}>
      {/* TODO: Insert your disclaimer here */}
      <Typography variant='h4'>Privacy</Typography>
      <Typography>Privacy policy stuff</Typography>
      {renderAcknowledge("acceptPrivacyPolicy", "I agree with the Privacy Policy")}
    </Stack>
  }
  return null
}


interface AuthComponentProps {
  tab: "signIn" | "signUp" | undefined;
}

export const AuthComponent: FC<AuthComponentProps> = ({tab}) => {
  // It's bad performance that I'm computing hideButton here, since it will trigger re-render of Authenticator
  // for every step/route change. But I tried handling it all within FormFields() and just setting hideButton,
  // couldn't get it working
  const {route} = useAuthenticator((context) => [context.route]);
  const done = useLocalStore(s => s.done)
  const hideButton = route === "signUp" && !done

  return <Authenticator
    className={hideButton ? 'hide-signup-button' : ''}
    loginMechanisms={["email"]}
    initialState={tab}
    components={{
      // Customize registration to add acknowledgement checkboxes. These are then saved to the Cognito user for compliance.
      SignUp: {
        FormFields() {
          return done ? <Authenticator.SignUp.FormFields /> : <Acknowledgements />
        }
      },
    }}
    services={{
      async validateCustomSignUp(formData) {
        let errors: [string, string][] = []
        // For some reason, `done` in scope isn't updating here. But the validate function is indeed being called
        // repeatedly. So I'm just grabbing it off the state manually.
        if (!useLocalStore.getState().done) {
          errors = [...errors, ['username', 'You must agree to the terms & conditions, disclaimer, and privacy policy']]
        }
        return errors.length ? Object.fromEntries(errors) : null
      },
    }}
  />
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

export function AcknowledgeChecker() {
  const [user, send] = useStore(s => [
    s.user?.me,
    s.send
  ], shallow)
  const [done, acks] = useLocalStore(s => [s.done, s.acks], shallow)

  useEffect(() => {
    // Once they've completed the steps, send the acceptance to the server. This will only happen if they go through
    // the process, since done stays false otherwise. Meaning, if they already accepted, `hide` prevents the flow
    if (done) {
      send("users_acknowledge_request", {})
    }
  }, [done])

  const hide = (
    !user
    || done
    || (user.accept_terms_conditions && user.accept_privacy_policy && user.accept_disclaimer)
  )
  if (hide) {return null}

  return <BasicDialog
    open={true}
    onClose={() => {}}
    size="md"
  >
    <DialogContent>
      <Acknowledgements />
    </DialogContent>
  </BasicDialog>
}

export function AuthProvider({children}: React.PropsWithChildren) {
  return <Authenticator.Provider>
    <AuthChecker />
    <AcknowledgeChecker />
    {children}
  </Authenticator.Provider>
}
