import React, {useEffect, useCallback, useState, FC} from 'react'
import {Amplify, Auth} from 'aws-amplify'
import {Authenticator, useAuthenticator, Theme, useTheme, ThemeProvider} from "@aws-amplify/ui-react";
import {awsConfig} from '../../utils/config'
import {useStore} from '../../data/store'
import "@aws-amplify/ui-react/styles.css";
import {theme as muiTheme} from '../Setup/Mui'


Amplify.configure(awsConfig);

interface AuthComponent {
  tab: "signIn" | "signUp" | undefined
}
export function AuthComponent({tab}: AuthComponent) {
  // https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
  // https://ui.docs.amplify.aws/react/theming#design-tokens
  // TODO customize colors / fonts
  const { tokens } = useTheme();
  const theme: Theme = {
    name: 'Auth Example Theme',
    tokens: {
      colors: {
        background: {
          primary: {
            value: tokens.colors.neutral['90'].value,
          },
          secondary: {
            value: tokens.colors.neutral['100'].value,
          },
        },
        font: {
          interactive: {
            value: tokens.colors.white.value,
          },
        },
        brand: {
          primary: {
            '10': tokens.colors.teal['100'],
            '80': tokens.colors.teal['40'],
            '90': tokens.colors.teal['20'],
            '100': tokens.colors.teal['10'],
          },
        },
      },
      components: {
        tabs: {
          item: {
            _focus: {
              color: {
                value: tokens.colors.white.value,
              },
            },
            _hover: {
              color: {
                value: tokens.colors.yellow['80'].value,
              },
            },
            _active: {
              color: {
                value: tokens.colors.white.value,
              },
            },
          },
        },
      },
    },
  };

  // return <ThemeProvider theme={theme}>
  return <ThemeProvider theme={theme}>
    <Authenticator
      loginMechanisms={["email"]}
      initialState={tab}
    />
  </ThemeProvider>
  // return <Authenticator loginMechanisms={loginMechanisms}>
  //     {({ signOut, user }) => {
  //       return <Typography>Welcome ${user.username}</Typography>
  //     }}
  // </Authenticator>
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
