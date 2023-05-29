import React, {useEffect, useCallback, useState, FC, memo} from 'react'
import {useStore} from '../../data/store'
import {Authenticator, useAuthenticator, Theme, useTheme, ThemeProvider, CheckboxField} from "@aws-amplify/ui-react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import {Acknowledgements, useAckStore} from "./Acknowledge";

interface AuthComponentProps {
  tab: "signIn" | "signUp" | undefined;
}

export const AuthComponent: FC<AuthComponentProps> = ({tab}) => {
  // It's bad performance that I'm computing hideButton here, since it will trigger re-render of Authenticator
  // for every step/route change. But I tried handling it all within FormFields() and just setting hideButton,
  // couldn't get it working
  const {route} = useAuthenticator((context) => [context.route]);
  const done = useAckStore(s => s.done)
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
          if (!useAckStore.getState().done) {
            errors = [...errors, ['username', 'You must agree to the terms & conditions, disclaimer, and privacy policy']]
          }
          return errors.length ? Object.fromEntries(errors) : null
        },
      }}
    />
  </ThemeProvider>
}

export function AuthStatusListener() {
  const {authStatus} = useAuthenticator((context) => [context.authStatus])
  const setAuthenticated = useStore (s => s.setAuthenticated)

  useEffect(() => {
    setAuthenticated(authStatus === "authenticated")
  }, [authStatus])
  return null
}



export function AuthProvider({children}: React.PropsWithChildren) {
  return <Authenticator.Provider>
    <AuthStatusListener />
    {children}
  </Authenticator.Provider>
}
