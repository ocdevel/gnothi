import Amplify from 'aws-amplify';
import {AmplifyAuthenticator, AmplifySignOut, AmplifySignUp, AmplifySignIn} from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import axios from "axios";
import {useStoreActions} from "easy-peasy";
import React, {useState, useEffect} from "react";
import _ from "lodash";

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
  }, []);

  return authState === AuthState.SignedIn && user ? (
    <div className="App">
      <div>Hello, {user.username}</div>
      <AmplifySignOut />
    </div>
    ) : (
    <AmplifyAuthenticator usernameAlias="email">
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
  );
}
