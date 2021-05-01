import {
  FaBalanceScale, FaBook,
  FaBug,
  FaCouch,
  FaDragon,
  FaGithub,
  FaMap,
  FaMicrophone,
  FaQuestionCircle,
  FaReddit,
  MdEmail
} from "react-icons/all";
import React from "react";
import {FullScreenDialog} from "../Helpers/Dialog";
import {DialogContent} from "@material-ui/core";

export default function Links({close}) {
  function renderLinks() {
    return <>
      <h5>Gnothi</h5>
      <ul className='list-unstyled'>
        <li>
          <FaCouch/> <a href="/about">About</a>{' '}
          <small className='text-muted'>Details about Gnothi's features</small>
        </li>
        <li>
          <FaQuestionCircle/> <a href="https://github.com/lefnire/gnothi/issues?q=label%3AFAQ"
                                 target='_blank'>FAQ</a>{' '}
          <small className='text-muted'>Frequently Asked Questions</small>
        </li>
        <li>
          <FaGithub/> <a href="https://github.com/lefnire/gnothi" target="_blank">Code</a>{' '}
          <small className='text-muted'>Gnothi is open source, hosted on Github</small>
        </li>
        <li>
          <FaMap/> <a href="https://github.com/lefnire/gnothi/projects/1" target="_blank">Roadmap</a>{' '}
          <small className='text-muted'>See what I'm working on now and in the future</small>
        </li>
        {/*<li>
          <FaDollarSign /> <a href="https://github.com/lefnire/gnothi/issues/96" target="_blank">Support</a>{' '}
          <small className='text-muted'>How to support the project</small>
        </li>*/}
      </ul>

      <h5>Feedback</h5>
      <ul className='list-unstyled'>
        <li>
          <FaBug/> <a href="https://github.com/lefnire/gnothi/issues/45" target="_blank">Bugs/Features</a>{' '}
          <small className='text-muted'>Submit bugs, feedback, and feature-requests as Github issues</small>
        </li>
        <li>
          <MdEmail/> <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}
          <small className='text-muted'>Don't hesitate to email <a href="https://www.linkedin.com/in/lefnire/"
                                                                   target="_blank">me</a> for any reason</small>
        </li>
      </ul>

      <h5>Community</h5>
      <ul className='list-unstyled'>
        <li>
          <FaDragon/> <a href="https://habitica.com/groups/guild/71a86c2f-4d84-49cc-8802-3dd69731447b" target="_blank">Habitica
          Guild</a>{' '}
          <small className='text-muted'>Join our small Habitica guild, chat therapy / journaling / Gnothi</small>
        </li>
        <li>
          <FaReddit/> <a href="https://www.reddit.com/r/gnothi" target="_blank">Reddit</a>{' '}
          <small className='text-muted'>Chat Gnothi on Reddit, help me break the silence there</small>
        </li>
        <li>
          <FaMicrophone/> <a href="http://ocdevel.com/mlg" target="_blank">Podcast</a>{' '}
          <small className='text-muted'>Gnothi is a follow-along project on a podcast I run about AI</small>
        </li>
      </ul>

      <h5>Legal</h5>
      <ul className='list-unstyled'>
        <li>
          <FaBalanceScale/> <a href="/privacy">Privacy Policy</a>{' '}
          <small className='text-muted'>If you have questions/concerns, see <a
            href="https://github.com/lefnire/gnothi/issues/46" target="_blank">this FAQ</a></small>
        </li>
        <li>
          <FaBalanceScale/> <a href="/terms">Terms of Use</a>{' '}
          <small className='text-muted'>If you have questions/concerns, see <a
            href="https://github.com/lefnire/gnothi/issues/46" target="_blank">this FAQ</a></small>
        </li>
      </ul>
    </>
  }
  return <FullScreenDialog open={true} onClose={close} title="Useful Links">
    <DialogContent>
      {renderLinks()}
    </DialogContent>
  </FullScreenDialog>
}
