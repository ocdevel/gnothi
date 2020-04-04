import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container, Row, Col, Tabs, Tab, Form, Button } from 'react-bootstrap';


const fetch_ = async (route, method='GET', body=null, jwt=null) => {
  const obj = {
    method,
    headers: {'Content-Type': 'application/json'},
  };
  if (body) obj['body'] = JSON.stringify(body)
  if (jwt) obj['headers']['Authorization'] = `JWT ${jwt}`
  const response = await fetch(`http://127.0.0.1:5000/${route}`, obj)
  return await response.json()
}

class Auth extends Component {
  componentDidMount() {
    this.checkJwt();
  }

  checkJwt = async () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) { return }
    const res = await fetch_('check-jwt', 'GET', null, jwt)
    if (res.status_code == 401) {
      return localStorage.removeItem('jwt')
    }
    this.props.onAuth(jwt);
  }

  login = async (username, password) => {
    const res = await fetch_('auth','POST', {username, password})
    const jwt = res.access_token;
    localStorage.setItem('jwt', jwt);
    this.props.onAuth(jwt);
  }

  submitLogin = async e => {
    // TODO switch to Axios https://malcoded.com/posts/react-http-requests-axios/
    e.preventDefault();
    this.login(
      e.target['formLoginEmail'].value,
      e.target['formLoginPassword'].value
    )
  };

  submitRegister = async e => {
    e.preventDefault();
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const username = e.target['formRegisterEmail'].value;
    const password = e.target['formRegisterPassword'].value;
    const res = await fetch_('register','POST',{username, password})
    this.login(username, password);
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
      <div>
        <Tabs defaultActiveKey="login">
          <Tab eventKey="login" title="Login">
            {this.renderLogin()}
          </Tab>
          <Tab eventKey="register" title="Register">
            {this.renderRegister()}
          </Tab>
        </Tabs>
      </div>
    )
  }
}

class Journal extends Component {
  state = {
    entries: [],
    creating: false
  }

  componentDidMount() {
    this.fetchEntries();
  }

  fetchEntries = async () => {
    const res = await fetch_('entries', 'GET', null, this.props.jwt)
    console.log(res);
    this.setState({entries: res.entries})
  }

  startNew = () => {
    this.setState({creating: true})
  }

  endNew = () => {
    this.setState({creating: false})
    this.fetchEntries()
  }

  submitNew = async e => {
    const title = e.target['formTitle'].value
    const text = e.target['formText'].value
    await fetch_('entries', 'POST', {title, text}, this.props.jwt)
  }

  renderForm = () => {
    const {creating} = this.state
    if (!creating) return (
      <Button variant="Primary" onClick={this.startNew}>New</Button>
    )
    return (
      <Form onSubmit={this.submitNew}>
        <Form.Group controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" placeholder="Title" />
        </Form.Group>

        <Form.Group controlId="formText">
          <Form.Label>Entry</Form.Label>
          <Form.Control type="textarea" placeholder="Entry" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    )
  }

  renderEntries = () => {
    const {entries} = this.state
    return (
      <div>
        <h2>Entries</h2>
        <ul>
          {entries.map(e => <li>{e.title}</li>)}
        </ul>
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.renderForm()}
        {this.renderEntries()}
      </div>
    )
  }
}

// function OldApp() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>Edit <code>src/App.js</code> and save to reload.</p>
//         <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">Learn React</a>
//       </header>
//     </div>
//   );
// }

class App extends Component {
  state = {
    jwt: null
  };

  onAuth = (jwt) => {
    this.setState({jwt})
  };

  render() {
    const {jwt} = this.state;
    return (
      <Container fluid>
        <h1>ML Journal</h1>
        {
          jwt ? <Journal jwt={jwt} />
            : <Auth onAuth={this.onAuth} />
        }
      </Container>
    )
  }
}

export default App;
