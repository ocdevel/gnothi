import React, { useEffect, useState } from "react";
import {CardElement, useStripe, useElements, Elements} from "@stripe/react-stripe-js";
import {Form, Button, Alert} from 'react-bootstrap'
import {loadStripe} from "@stripe/stripe-js";

import { useDispatch, useSelector } from 'react-redux'
import { fetch_, setServerError, getUser } from '../redux/actions'

function CheckoutForm() {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const error = useSelector(state => state.serverError);

  const dispatch = useDispatch()

  async function setupStripe() {
    // Step 1: Fetch product details such as amount and currency from
    // API to make sure it can't be tampered with in the client.
    const {data: productDetails} = await dispatch(fetch_("stripe/product-details"))
    setAmount(productDetails.amount / 100);
    setCurrency(productDetails.currency);

    // Step 2: Create PaymentIntent over Stripe API
    const {data: clientSecret} = await dispatch(fetch_("stripe/create-payment-intent", 'POST'))
    setClientSecret(clientSecret.client_secret);
  }

  useEffect(() => {
    setupStripe()
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);

    // Step 3: Use clientSecret from PaymentIntent and the CardElement
    // to confirm payment with stripe.confirmCardPayment()
    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: ev.target.name.value,
        },
      },
    });

    if (payload.error) {
      setServerError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
      console.log("[error]", payload.error);
    } else {
      setServerError(null);
      setSucceeded(true);
      setProcessing(false);
      setMetadata(payload.paymentIntent);
      console.log("[PaymentIntent]", payload.paymentIntent);
      setTimeout(() => {
        dispatch(getUser())
      }, 4000)
    }
  };

  const renderSuccess = () => {
    return <>
      <Alert variant='success'>Success! Thank you!</Alert>
      <p>If you still see the ad, refresh in a bit.</p>
      {/*<p>View PaymentIntent response:</p>*/}
      {/*<pre className="sr-callout">*/}
      {/*  <code>{JSON.stringify(metadata, null, 2)}</code>*/}
      {/*</pre>*/}
    </>
  };

  const renderForm = () => {
    const options = {
      style: {
        base: {
          color: "#32325d",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a",
        },
      },
    };

    const amount_ = currency.toLocaleUpperCase() + " " +
      amount.toLocaleString(navigator.language, {
        minimumFractionDigits: 2,
      })

    return <>
      <p>As a thank you for early-adopting Gnothi during its growing pains, pay {amount_} <strong>once now</strong> and become to premium member for life. Premium will eventually be a monthly payment, so act fast! The current premium perk is ad-removal, but many more perks will come as I add new features.</p>

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formName">
          <Form.Control
            type="text"
            id="name"
            name="name"
            autoComplete="cardholder"
            placeholder="Name on card"
          />
        </Form.Group>
        <Form.Group controlId="formCard">
          <CardElement
            className="sr-input sr-card-element"
            options={options}
          />
        </Form.Group>

        {error && <div className="message sr-field-error">{error}</div>}

        <Button
          variant='primary'
          type='submit'
          disabled={processing || !clientSecret || !stripe}
        >
          {processing ? 'Processing' : <>Pay {amount_}</>}
        </Button>
      </Form>
    </>
  };

  return succeeded ? renderSuccess() : renderForm()
}

export default function Stripe() {
  const [stripe, setStripe] = useState()
  const dispatch = useDispatch()
  async function loadStripe_() {
    const {data} = await dispatch(fetch_("stripe/public-key"))
    setStripe(loadStripe(data.publicKey))
  }

  useEffect(() => {
    loadStripe_()
  }, [])

  if (!stripe) {return null}

  return <Elements stripe={stripe}>
    <CheckoutForm />
  </Elements>
}
