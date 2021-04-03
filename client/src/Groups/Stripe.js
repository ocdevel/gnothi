import React, { useEffect, useState } from "react";
import {CardElement, useStripe, useElements, Elements} from "@stripe/react-stripe-js";
import {Form, Button, Alert} from 'react-bootstrap'
import {loadStripe} from "@stripe/stripe-js";
import {useStoreState, useStoreActions} from "easy-peasy";
import Error from "../Error";
import * as yup from "yup";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";

const stripeSchema = yup.object().shape({
  name: yup.string().required(),
})


let stripe_

export default function Stripe({submit, product='create_group'}) {
  const emit = useStoreActions(a => a.ws.emit)
  const pk = useStoreState(s => s.ws.data['payments/public_key/get'])
  const [ready, setReady] = useState(!!stripe_)

  useEffect(() => {
    if (!pk || ready) {return}
    stripe_ = loadStripe(pk.publicKey)
    setReady(true)
  }, [pk])

  useEffect(() => {
    emit(['payments/public_key/get', {}])
    emit(['payments/product/get', {product}])
  }, [])

  if (!ready) {return null}
  return <Elements stripe={stripe_}>
    <CheckoutForm submit={submit} product={product} />
  </Elements>
}

function CheckoutForm({submit, product}) {
  const emit = useStoreActions(a => a.ws.emit)
  const [status, setStatus] = useState({})
  const [metadata, setMetadata] = useState(null);
  const stripe = useStripe();
  const elements = useElements();

  const groupProduct = useStoreState(s => s.ws.data['payments/product/get'])
  const paymentIntent = useStoreState(s => s.ws.data['payments/payment_intent/post'])

  const form = useForm({
    resolver: yupResolver(stripeSchema),
  })

  useEffect(() => {
    emit(['payments/payment_intent/post', {product}])
  }, [])

  if (!(groupProduct && paymentIntent)) {return null}
  const {amount, currency} = groupProduct
  const {clientSecret} = paymentIntent

  const handleSubmit = async billing_details => {
    setStatus({processing: true});

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details
      },
    });

    if (payload.error) {
      setStatus({error: `Payment failed: ${payload.error.message}`});
      console.error("[error]", payload.error);
    } else {
      setStatus({success: true})
      setMetadata(payload.paymentIntent);
      submit(payload.paymentIntent)
      console.log("[PaymentIntent]", payload.paymentIntent);
      // TODO send success via stripe-hook to websocket
    }
  };

  const amt = currency.toLocaleUpperCase() + " " +
    (amount / 100).toLocaleString(navigator.language, {
      minimumFractionDigits: 2,
    })

  return <>
    <Form onSubmit={form.handleSubmit(handleSubmit)}>
      <Form.Group controlId="formName">
        <Form.Control
          type="text"
          {...form.register("name")}
          autoComplete="cardholder"
          placeholder="Name on card"
        />
      </Form.Group>
      <Form.Group controlId="formCard">
        <CardElement
          className="sr-input sr-card-element form-control pt-2"
          options={{style: {
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
          }}}
        />
      </Form.Group>

      <Error action={/payments.*/g} codes={[400, 401, 403, 500]} />
      <Error message={status.error} />

      <Button
        variant='primary'
        type='submit'
        className='float-right'
        disabled={status.processing || !clientSecret || !stripe}
      >
        {status.processing ? 'Processing' : <>Pay {amt}</>}
      </Button>
    </Form>
  </>
}