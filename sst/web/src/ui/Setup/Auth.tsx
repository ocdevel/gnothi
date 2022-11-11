import React, {useEffect, useCallback, useState, FC} from 'react'
import {Amplify, Auth} from 'aws-amplify'
import {Authenticator, useAuthenticator} from "@aws-amplify/ui-react";
import {awsConfig} from '../../utils/config'
import {useStore} from '../../data/store'
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsConfig);
const loginMechanisms = ['email'] as const

export function AuthComponent() {
  return <Authenticator loginMechanisms={loginMechanisms} />
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
