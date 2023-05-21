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
import {Helmet} from "react-helmet-async";

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


interface AuthComponentProps {
  tab: "signIn" | "signUp" | undefined;
}

type Checked = 'custom:yesTerms_Disclaimer' | 'custom:yesPrivacyPolicy'
export const AuthComponent: FC<AuthComponentProps> = ({tab}) => {
  // It's bad performance that I'm computing hideButton here, since it will trigger re-render of Authenticator
  // for every step/route change. But I tried handling it all within FormFields() and just setting hideButton,
  // couldn't get it working
  const {route} = useAuthenticator((context) => [context.route]);
  const [step, setStep] = useState(1);
  const hideButton = route === "signUp" && step !== 3

  return <Authenticator
    className={hideButton ? 'hide-signup-button' : ''}
    loginMechanisms={["email"]}
    initialState={tab}
    components={{
      SignUp: {
        FormFields() {
          const [checked, setChecked] = useState<Record<Checked, boolean>>({
            'custom:yesTerms_Disclaimer': false,
            'custom:yesPrivacyPolicy': false,
          })

          function nextStep() {
            setStep(step + 1)
          }

          // const { validationErrors } = useAuthenticator();
          function renderAcknowledge(name: Checked, label: string) {
            // errorMessage={validationErrors[name] as string}
            // hasError={!!validationErrors[name]}
            return <CheckboxField
              checked={checked[name]}
              onChange={(e) => setChecked({...checked, [name]: e.target.checked})}
              isRequired
              name={name}
              value="yes"
              label={label}
            />
          }

          if (step === 1) {
            return <Stack spacing={2}>
              {/* TODO: Insert your disclaimer here */}
              <Typography variant='h4'>Disclaimer</Typography>
              <Typography>Gnothi is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical or mental health emergency, immediately contact a healthcare professional or dial 911. Use of our services is at your own risk. Our platform doesn't provide medical care, and health advice should be sought from licensed professionals. You are solely responsible for seeking appropriate treatment.</Typography>
              {renderAcknowledge("custom:yesTerms_Disclaimer", "I agree with the Terms & Conditions")}
              <Button
                variant="contained"
                fullWidth
                disabled={!checked['custom:yesTerms_Disclaimer']}
                onClick={nextStep}
              >Next</Button>
            </Stack>
          }
          if (step === 2) {
            return <Stack spacing={2}>
              {/* TODO: Insert your disclaimer here */}
              <Typography variant='h4'>Privacy</Typography>
              <Typography>Privacy policy stuff</Typography>
              {renderAcknowledge("custom:yesPrivacyPolicy", "I agree with the Privacy Policy")}
              <Button
                variant="contained"
                fullWidth
                disabled={!checked['custom:yesPrivacyPolicy']}
                onClick={nextStep}
              >Next</Button>
            </Stack>
          }
          return <Authenticator.SignUp.FormFields/>
        }
      },
    }}
    services={{
      async validateCustomSignUp(formData) {
        let errors: [string, string][] = []
        if (!formData['custom:yesTerms_Disclaimer']) {
          errors = [...errors, ['custom:yesTerms_Disclaimer', 'You must agree to the Terms & Conditions']]
        }
        if (!formData['custom:yesPrivacyPolicy']) {
          errors = [...errors, ['custom:yesPrivacyPolicy', 'You must agree to the Privacy Policy']]
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

export function AuthProvider({children}: React.PropsWithChildren) {
  return <Authenticator.Provider>
    <AuthChecker />
    {children}
  </Authenticator.Provider>
}
