// import {AmplifyAuthContainer, AmplifyAuthenticator, AmplifySignOut, AmplifySignUp, AmplifySignIn} from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import {useStore} from "@gnothi/web/src/data/store";
import React, {useState, useEffect} from "react";
import _ from "lodash";
import {Alert2} from "@gnothi/web/src/ui/Components/Misc";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import {formFields} from './formFields'
import '@aws-amplify/ui-react/styles.css';

import {awsExports} from "@gnothi/web/src/utils/config"
Amplify.configure(awsExports);

// TODO https://ui.docs.amplify.aws/react/connected-components/authenticator

export default function AmplifyAuth() {
  const setJwt = useStore(state => state.setJwt)
  const [authState, setAuthState] = useState();
  const [user, setUser] = useState();

  useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      // console.log('nextAuthState', nextAuthState)
      // console.log('authData', authData)
      setAuthState(nextAuthState);
      setUser(authData)
      const jwt = _.get(authData, "signInUserSession.accessToken.jwtToken")
      // checkJwt(jwt)
      setJwt(jwt)
    });
  }, [])

  function renderLoggedIn() {
    return <div className="App">
      <div>Hello, {user.username}</div>
      <AmplifySignOut />
    </div>
  }

  function renderLogin() {
    // TODO I can't get the height of the AuthContainer to be just relative/normal.
    // Need to specify (see App.scss) per https://github.com/aws-amplify/amplify-js/discussions/7820
    // and I'm not sure I'm doing it right.
    return <>
      <Box className='custom-amplify-container'>
        <AmplifyAuthContainer>
          <AmplifyAuthenticator
            usernameAlias="email"
          >
            <AmplifySignUp
              slot="sign-up"
              usernameAlias="email"
              formFields={[
                {
                  type: "email",
                  label: "Email",
                  placeholder: "Enter your email address",
                  required: true,
                },
                {
                  type: "password",
                  label: "Password",
                  placeholder: "Enter your password",
                  required: true,
                },
                // {
                //   type: "phone_number",
                //   label: "Custom Phone Label",
                //   placeholder: "custom Phone placeholder",
                //   required: false,
                // },
              ]}
            />
            <AmplifySignIn
              slot="sign-in"
              usernameAlias="email"
            />
          </AmplifyAuthenticator>
        </AmplifyAuthContainer>
      </Box>
      <Alert2 severity='warning'>Returning users, do a one-time password reset. <a href="https://github.com/lefnire/gnothi/issues/107#issuecomment-846515846" target="_blank">Details here</a>.</Alert2>
    </>
  }


  return <div className='auth-block'>
    {authState === AuthState.SignedIn && user
      ? renderLoggedIn() : renderLogin()}
  </div>
}
