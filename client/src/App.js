import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './logo.svg';
import './App.css';
import { Container, Row, Col, Tabs, Tab, Form, Button } from 'react-bootstrap';


class Auth extends Component {
  submitLogin = async e => {
    // TODO switch to Axios https://malcoded.com/posts/react-http-requests-axios/
    e.preventDefault();
    const response = await fetch('http://127.0.0.1:5000/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: e.target['formLoginEmail'].value,
        password: e.target['formLoginPassword'].value
      })
    })
    console.log(await response.json())
  };

  submitRegister = async e => {
    e.preventDefault();
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const response = await fetch('http://127.0.0.1:5000/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: e.target['formRegisterEmail'].value,
        password: e.target['formRegisterPassword'].value
      })
    })
    console.log(await response.json())

  };

  renderLogin = () => {
    return (
      <Form onSubmit={this.submitLogin}>
        <Form.Group controlId="formLoginEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>

        <Form.Group controlId="formLoginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    )
  };

  renderRegister = () => {
    return (
      <Form onSubmit={this.submitRegister}>
        <Form.Group controlId="formRegisterEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>

        <Form.Group controlId="formRegisterPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>
        <Form.Group controlId="formRegisterPasswordConfirm">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control type="password" placeholder="Confirm Password" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
    )
  };

  render() {
    return (
      <Container fluid>
        <h1>ML Journal</h1>
        <Tabs defaultActiveKey="login">
          <Tab eventKey="login" title="Login">
            {this.renderLogin()}
          </Tab>
          <Tab eventKey="register" title="Register">
            {this.renderRegister()}
          </Tab>
        </Tabs>
      </Container>
    )
  }
}

function OldApp() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function App(){
  return (
    <div>
      <Auth />
    </div>
  )
}

export default App;
