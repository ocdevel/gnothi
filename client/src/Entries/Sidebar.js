import React from "react";
import Fields from "../Fields/Fields";
import {
  Accordion,
  Button,
  Card,
  Form,
  Row,
  Col
} from "react-bootstrap";
import {
  FaGithub,
  FaQuestionCircle,
  FaCouch,
  FaMap,
  FaBug,
  MdEmail,
  FaMicrophone,
  FaDragon, FaReddit
} from "react-icons/all";

export default function Sidebar() {
  return <>
    <Accordion defaultActiveKey="fields">
      <Card>
        <Accordion.Toggle as={Card.Header} variant="link" eventKey="fields">
          Fields
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="fields">
          <Card.Body>
            <Fields />
          </Card.Body>
        </Accordion.Collapse>
      </Card>

      <Card>
        <Accordion.Toggle as={Card.Header} variant="link" eventKey="links">
          Links
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="links">
          <Card.Body>
            <ul className='list-unstyled'>
              <li>Gnothi<ul>
                <li>
                  <FaCouch /> <a href="/about">About</a>
                </li>
                <li>
                  <FaQuestionCircle /> <a href="https://github.com/lefnire/gnothi/issues?q=label%3AFAQ" target='_blank'>FAQ</a>
                </li>
                <li>
                  <FaGithub /> <a href="https://github.com/lefnire/gnothi" target="_blank">Code</a>
                </li>
                <li>
                  <FaMap /> <a href="https://github.com/lefnire/gnothi/projects/1" target="_blank">Roadmap</a>
                </li>
              </ul></li>

              <li>Feedback<ul>
                <li>
                  <FaBug /> <a href="https://github.com/lefnire/gnothi/issues/45" target="_blank">Bugs/Features</a>
                </li>
                <li>
                  <MdEmail /> <a href="mailto:tylerrenelle@gmail.com">Contact Tyler</a>
                </li>
              </ul></li>

              <li>Community<ul>
                <li>
                  <FaDragon /> <a href="https://habitica.com/groups/guild/71a86c2f-4d84-49cc-8802-3dd69731447b" target="_blank">Habitica Guild</a>
                </li>
                <li>
                  <FaReddit /> <a href="https://www.reddit.com/r/gnothi" target="_blank">Reddit</a>
                </li>
                <li>
                  <FaMicrophone /> <a href="http://ocdevel.com/mlg" target="_blank">Podcast</a>
                </li>
              </ul></li>

            </ul>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  </>
}
