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
import {create} from "zustand";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {shallow} from "zustand/shallow";
import {BasicDialog} from "../Components/Dialog.tsx";
import DialogContent from "@mui/material/DialogContent";
import "./Auth.scss"
import Alert from "@mui/material/Alert";
import MUILink from '@mui/material/Link';
import IconButton from "@mui/material/IconButton";
import {IconBase} from "react-icons";
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';

Amplify.configure(awsConfig);

// Create a Zustand store local to this file to track just the two acknowledgement checkboxes.
type AcksObj = {
  acceptTermsConditionsDisclaimerPrivacyPolicy: Date | null
}
type AcksKeys = keyof AcksObj
const useLocalStore = create<{
  acks: AcksObj
  setAcks: (acks: Partial<AcksObj>) => void
  done: boolean
  setDone: (done: boolean) => void
}>((set, get) => ({
  acks: {
    acceptTermsConditionsDisclaimerPrivacyPolicy: null,
  },
  setAcks: (acks: Partial<AcksObj>) => set({acks: {...get().acks, ...acks}}),
  done: false,
  setDone: (done: boolean) => set({done}),
}))


interface Acknowledgements {
  existingUser?: boolean
}
function Acknowledgements({existingUser}: Acknowledgements) {
  const [
    acks,
    setAcks,
    setDone
  ] = useLocalStore(s => [
    s.acks,
    s.setAcks,
    s.setDone
  ], shallow)
  const [step, setStep] = useState<number>(0)

  const btnProps = {
    variant: "contained",
    fullWidth: true,
    className: 'btn-next'
  } as const

  const titleProps = {variant:'h4', fontWeight: 500, mb: 0} as const
  const subtitleProps = {variant:'body1', fontWeight: 600} as const
  const body1Props = {variant:'body1', fontWeight: 300} as const
  const body2Props = {variant: 'body2', fontWeight: 300} as const

  const steps = [
    ...(!existingUser ? [] : [<Stack mb={2}>
      <Stack mb={2}>
      <Typography {...titleProps}>Welcome back!</Typography>
      <Stack mb={2}>
        <Typography {...subtitleProps}>We're thrilled to announce the launch of Gnothi v1!</Typography>
        </Stack>
        <Typography>If you have any questions, or need any help navigating the new updates, feel free to drop us an <a href="mailto:gnothi@gnothiai.com">email</a> or reach out on <a href="https://discord.gg/TNEvx2YR" target="_blank">Discord</a> to connect.</Typography>
        </Stack>
        <Stack mb={2} justifyItems="center">
        <Typography><CheckIcon sx={{fontSize:15, mr:1}}/>New features coming soon</Typography>
        <Typography><CheckIcon sx={{fontSize:15, mr:1}}/>Fields is getting a makeover</Typography>
        <Typography><CheckIcon sx={{fontSize:15, mr:1}}/>Sharing will be back too</Typography>
        </Stack>
        <Stack mb={4}>
        <Typography>Thanks for being part of the Gnothi community!</Typography>
          </Stack>
        <Button
        {...btnProps}
        onClick={nextStep}
      >Next</Button>
    </Stack>]),

    <Stack spacing={2}>
      <Typography {...titleProps}>{existingUser ? "Updated Privacy Policy and Terms & Conditions" : "Welcome to Gnothi!"}</Typography>
      <Typography {...subtitleProps}>Please take a moment to review the following disclaimer, as well as Gnothi's <a href="/terms" target="_blank"> Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a></Typography>
      <Typography {...body2Props}><u>Disclaimer</u>: Gnothi is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical or mental health emergency, immediately contact a healthcare professional or dial 911. You are solely responsible for seeking appropriate treatment.
      </Typography>
      {renderAcknowledge("acceptTermsConditionsDisclaimerPrivacyPolicy", "I confirm that I am 18 or older, and accept Gnothi's Terms & Conditions and Privacy Policy")}

      <Stack direction="row" spacing={1}>
        {existingUser && <IconButton color="primary" onClick={goBack}>
          <ArrowBackOutlinedIcon />
        </IconButton>}
        <Button
          {...btnProps}
          disabled={!acks.acceptTermsConditionsDisclaimerPrivacyPolicy}
          onClick={nextStep}
        >Next</Button>
    </Stack>
    </Stack>,
  ]

  function goBack() {
    if (step === 0) { return }
    setStep(step-1)
  }

  function nextStep() {
    const newStep = step + 1
    setStep(newStep)
    const isEnd = newStep === steps.length
    console.log({isEnd, newStep, stepsLength: steps.length})
    if (isEnd && acks.acceptTermsConditionsDisclaimerPrivacyPolicy) {
      setDone(true)
    }
  }

  function renderAcknowledge(name: AcksKeys, label: string) {
    return <FormControlLabel
      alignItems="flex-start"
      className={`checkbox-${name}`}
      control={<Checkbox
        checked={!!acks[name]}
        onChange={() => setAcks({
          ...acks,
          [name]: acks[name] ? null : new Date()
        })}
      />}
      label={label}
    />
  }

  return steps[step] || null
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

  // https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
  // https://ui.docs.amplify.aws/react/theming#design-tokens
  // TODO customize colors / fonts
  // 177a5482 - sample theme

  // return <Authenticator loginMechanisms={loginMechanisms}>
  //     {({ signOut, user }) => {
  //       return <Typography>Welcome ${user.username}</Typography>
  //     }}
  // </Authenticator>

  const { tokens } = useTheme();
  const theme: Theme = {
    name: 'Auth Example Theme',
    tokens: {
      colors: {
        background: {
          primary: {
            value: "#ffffff",
          },
          secondary: {
            value: "##0077C2",
          },
        },
        font: {
          interactive: {
            value: "#0077C2",
          },
        },
        brand: {
          primary: {
            value: "#000000",
          },
        },
      },
      components: {
        tabs: {
          item: {
            _focus: {
              color: {
                value: "#000000",
              },
            },
            _hover: {
              color: {
                value: "#000000",
              },
            },
            _active: {
              color: {
                value: "#000000",
              },
            },
          },
        },
      },
    },
  };

  return <ThemeProvider theme={theme}>
    <Authenticator
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
        SignIn: {
          Header() {
            return <Alert sx={{fontWeight: 500}} severity="info">
              <Box mb={2}>
                We've made some exciting changes, including a new authentication system. If you're a
                returning user, you'll need to <strong><u>click "forgot password" below</u></strong> to reset it and sign in.
              </Box>
              <Box>
                Have questions? Get in touch at <a href="mailto:gnothi@gnothai.com">gnothi@gnothiai.com</a>
              </Box>
            </Alert>
          }
        }
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
  </ThemeProvider>
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
      <Acknowledgements existingUser={true} />
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
