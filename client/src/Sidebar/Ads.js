import React, {useState, useEffect} from 'react'
import {Card, Button, Modal} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import Stripe from "./Stripe.js";
import "./Ads.scss";
import {fetch_, getFields, getUser} from "../redux/actions";
import _ from 'lodash'

function PaymentModal({show, close}) {
  const dispatch = useDispatch()

  return (
    <Modal show={show} onHide={close} >
      <Modal.Header closeButton>
        <Modal.Title>Premium</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Stripe />
      </Modal.Body>
    </Modal>
  )
}

const ads = [
  <><a href="https://www.amazon.com/Real-Zen-for-Life/dp/B08P3WKX75/ref=as_li_ss_il?dchild=1&keywords=Real+Zen+for+Real+Life&qid=1607046048&s=audible&sr=1-2&linkCode=li3&tag=ha0d2-20&linkId=d31deef041607e17a5f8af8a015cfc54&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B08P3WKX75&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B08P3WKX75" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Boosting-Your-Emotional-Intelligence/dp/B072MZXVJZ/ref=as_li_ss_il?dchild=1&keywords=Boosting+Your+Emotional+Intelligence&qid=1607046542&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=a91114e7c90159202544420442b641ce&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B072MZXVJZ&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B072MZXVJZ" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Cognitive-Behavioral-Therapy-audiobook/dp/B010F5AA86/ref=as_li_ss_il?dchild=1&keywords=Cognitive+Behavioral+Therapy:+Techniques+for+Retraining+Your+Brain&qid=1607046581&s=audible&sr=1-4&linkCode=li3&tag=ha0d2-20&linkId=7fab648bb303524c1978a7b8a2ea9fe1&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B010F5AA86&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B010F5AA86" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Outsmart-Yourself-Brain-Based-Strategies-Better/dp/B01N3JJG9U/ref=as_li_ss_il?dchild=1&keywords=Outsmart+Yourself:+Brain-Based+Strategies+to+a+Better+You&qid=1607046629&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=0d5e99c55e323a4b6c7885b45478aeb8&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B01N3JJG9U&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B01N3JJG9U" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Your-Best-Brain-Science-Improvement/dp/B00PLAMNX6/ref=as_li_ss_il?dchild=1&keywords=Your+Best+Brain&qid=1607046666&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=9734c5d27a93eb20411c592e32f5a6e2&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B00PLAMNX6&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B00PLAMNX6" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/The-Science-of-Mindfulness-audiobook/dp/B00MFW8USU/ref=as_li_ss_il?dchild=1&keywords=The+Science+of+Mindfulness:+A+Research-Based+Path+to+Well-Being&qid=1607046699&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=e58ed1d16031e829f54d2a28bd34116a&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B00MFW8USU&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B00MFW8USU" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Yoga-for-Healthy-Mind-and-Body-audiobook/dp/B07K8XH13M/ref=as_li_ss_il?dchild=1&keywords=Yoga+for+a+Healthy+Mind+and+Body&qid=1607046734&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=dbea912ab48eec52b75b94e122eab354&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07K8XH13M&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B07K8XH13M" width="1" height="1" border="0" alt="" className='audible-ad' /></>,

  <><a href="https://www.amazon.com/Practicing-Mindfulness-Introduction-Meditation/dp/B00DTO49Y2/ref=as_li_ss_il?dchild=1&keywords=Practicing+Mindfulness:+An+Introduction+to+Meditation&qid=1607046775&s=audible&sr=1-1&linkCode=li3&tag=ha0d2-20&linkId=2544f0476984b1aaa4a0d6fb3b8e4e50&language=en_US" target="_blank"><img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B00DTO49Y2&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=ha0d2-20&language=en_US" /></a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=ha0d2-20&language=en_US&l=li3&o=1&a=B00DTO49Y2" width="1" height="1" border="0" alt="" className='audible-ad' /></>
]

const ad = _.sample(ads)

export default function Ads() {
  const [show, setShow] = useState(false)
  const user = useSelector(state => state.user)
  const entries = useSelector(state => state.entries)

  if (user.paid || entries.length < 3) {return null}

  return <>
    <PaymentModal show={show} close={() => setShow(false)}/>
    <Card className='mt-3 advert'>
      <Card.Header>
        <div className='float-right'>
          <Button variant='link' size='sm' onClick={() => setShow(true)}>Remove Ads</Button>{' '}
          <Button variant='link' size='sm' href="mailto:tylerrenelle@gmail.com?subject=Advertise on Gnothi">Advertise Here</Button>
        </div>
        <span>Advertisement</span>
      </Card.Header>
      {ad}
    </Card>
  </>
}
