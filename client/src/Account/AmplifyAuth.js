import Amplify from 'aws-amplify';
import {AmplifyAuthContainer, AmplifyAuthenticator, AmplifySignOut, AmplifySignUp, AmplifySignIn} from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import {useStoreActions} from "easy-peasy";
import React, {useState, useEffect} from "react";
import _ from "lodash";
import {Alert2} from "../Helpers/Misc";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";

Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: "us-east-1",
    userPoolId: "us-east-1_Tsww98VBH",
    userPoolWebClientId: "5rh3bkhtmcskqer9t17gg5fn65"
  },
});

export default function AmplifyAuth() {
  const setJwt = useStoreActions(actions => actions.user.setJwt)
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
      <Alert2 severity='warning'>Returning users, do a one-time password reset. <a href="https://github.com/lefnire/gnothi/issues/107" target="_blank">Details here</a>.</Alert2>
    </>
  }


  return authState === AuthState.SignedIn && user
    ? renderLoggedIn() : renderLogin()
}
