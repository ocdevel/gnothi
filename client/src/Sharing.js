import {Badge, Button, Form} from "react-bootstrap";
import React from "react";

export default function Sharing({jwt}) {
  return <div>
    <Form>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Therapist Email address</Form.Label>
        <Form.Control type="email" placeholder="Enter email" />
        <Form.Text className="text-muted">
          Email of person you'll share data with
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="exampleForm.ControlSelect2">
        <Form.Label>Share</Form.Label>
        <Form.Control as="select" multiple>
          <option>Summaries</option>
          <option>Themes</option>
          <option>Sentiment</option>
          <option>Field Charts</option>
          <option>Family</option>
          <option>Entries (specified per entry)</option>
        </Form.Control>
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
    <hr/>
    <div>
      <p>Sharing with:</p>
      <Badge variant="secondary">megantherapy@gmail.com x</Badge><br/>
      <Badge variant="secondary">lisarenelle@gmail.com x</Badge>
    </div>
  </div>
}
