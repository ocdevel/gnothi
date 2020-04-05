import React, { Component, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import moment from 'moment'
import {
  Container,
  Tabs,
  Tab,
  Form,
  Button,
  Table,
  Row,
  Col
} from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useRouteMatch,
  useParams
} from "react-router-dom";
import ReactMarkdown from 'react-markdown'

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

function Auth({onAuth}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')


  const checkJwt = async () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) { return }
    const res = await fetch_('check-jwt', 'GET', null, jwt)
    if (res.status_code == 401) {
      return localStorage.removeItem('jwt')
    }
    onAuth(jwt);
  }

  useEffect(() => {
    checkJwt()
  }, [])

  const changeUsername = e => setUsername(e.target.value)
  const changePassword = e => setPassword(e.target.value)
  const changePasswordConfirm = e => setPasswordConfirm(e.target.value)

  const login = async () => {
    const res = await fetch_('auth','POST', {username, password})
    const jwt = res.access_token;
    localStorage.setItem('jwt', jwt);
    onAuth(jwt);
  }

  const submitLogin = async e => {
    // TODO switch to Axios https://malcoded.com/posts/react-http-requests-axios/
    e.preventDefault();
    login()
  };

  const submitRegister = async e => {
    e.preventDefault();
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const res = await fetch_('register','POST',{username, password})
    login();
  };

  const renderLogin = () => {
    return (
      <Form onSubmit={submitLogin}>
        <Form.Group controlId="formLoginEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            value={username}
            onChange={changeUsername}
          />
        </Form.Group>

        <Form.Group controlId="formLoginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={changePassword}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    )
  };

  const renderRegister = () => {
    return (
      <Form onSubmit={submitRegister}>
        <Form.Group controlId="formRegisterEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            value={username}
            onChange={changeUsername}
          />
        </Form.Group>

        <Form.Group controlId="formRegisterPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={changePassword}
          />
        </Form.Group>
        <Form.Group controlId="formRegisterPasswordConfirm">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm Password"
            required
            value={passwordConfirm}
            onChange={changePasswordConfirm}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Register
        </Button>
      </Form>
    )
  };

  return (
    <div>
      <Tabs defaultActiveKey="login">
        <Tab eventKey="login" title="Login">
          {renderLogin()}
        </Tab>
        <Tab eventKey="register" title="Register">
          {renderRegister()}
        </Tab>
      </Tabs>
    </div>
  )
}

function Entries({jwt}) {
  const [entries, setEntries] = useState([])
  const history = useHistory()

  const fetchEntries = async () => {
    const res = await fetch_('entries', 'GET', null, jwt)
    setEntries(res.entries)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const gotoForm = (entry_id=null) => {
    history.push(entry_id ? `/entry/${entry_id}` : '/entry')
  }

  const deleteEntry = async entry => {
    if (window.confirm(`Delete "${entry.title}?"`)) {
      await fetch_(`entries/${entry.id}`, 'DELETE', null, jwt)
      fetchEntries()
    }
  }

  return (
    <div>
      <Button variant="primary" size='lg' onClick={gotoForm}>New Entry</Button>
      <hr/>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr>
              <td>{moment(e.created_at).format('YYYY-MM-DD h:mm a')}</td>
              <td>{e.title}</td>
              <td>
                <Button size='sm' onClick={() => gotoForm(e.id)}>Edit</Button>&nbsp;
                <Button variant='danger' size='sm' onClick={() => deleteEntry(e)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function Entry(props) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    (async () => {
      if (!entry_id) { return }
      const res = await fetch_(`entries/${entry_id}`, 'GET', null, props.jwt)
      setTitle(res.title)
      setText(res.text)
    })()
  }, [entry_id])

  const cancel = () => history.push('/')

  const submit = async e => {
    e.preventDefault()
    if (entry_id) {
      await fetch_(`entries/${entry_id}`, 'PUT', {title, text}, props.jwt)
    } else {
      await fetch_(`entries`, 'POST', {title, text}, props.jwt)
    }
    history.push('/')
  }

  const changeTitle = e => setTitle(e.target.value)
  const changeText = e => setText(e.target.value)

  return (
    <Form onSubmit={submit}>
      <Form.Group controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Title"
          value={title}
          onChange={changeTitle}
        />
      </Form.Group>

      <Row>
        <Col>
          <Form.Group controlId="formText">
            <Form.Label>Entry</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Entry"
              required
              rows={10}
              value={text}
              onChange={changeText}
            />
          </Form.Group>
        </Col>
        <Col style={{backgroundColor: '#eee'}}>
          <ReactMarkdown source={text} />
        </Col>
      </Row>

      <Button variant="primary" type="submit">
        Submit
      </Button>&nbsp;
      <Button variant='secondary' size="sm" onClick={cancel}>
        Cancel
      </Button>
    </Form>
  )
}

class Journal extends Component {
  render() {
    const {jwt} = this.props
    return (
      <Switch>
        <Route path="/entry/:entry_id">
          <Entry jwt={jwt} />
        </Route>
        <Route path="/entry">
          <Entry jwt={jwt} />
        </Route>
        <Route exact path="/">
          <Entries jwt={jwt} />
        </Route>
    </Switch>
    )
  }
}

function App() {
  const [jwt, setJwt] = useState()

  const onAuth = jwt => setJwt(jwt)

  return (
    <Router>
      <Container fluid>
        <Link to="/"><h1>ML Journal</h1></Link>
        {
          jwt ? <Journal jwt={jwt} />
            : <Auth onAuth={onAuth} />
        }
      </Container>
    </Router>
  )
}

export default App;
