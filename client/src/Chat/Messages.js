import {useStoreState} from "easy-peasy";
import React, {useLayoutEffect, useRef} from "react";
import {ChatFeed, Message} from "react-chat-ui";

export function Messages({messages, members}) {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const el = useRef()

  useLayoutEffect(() => {
    const el_ = el.current
    if (!el_) {return}
    el_.scrollTop = el_.scrollHeight
  })

  messages = messages.slice().reverse().map(m => new Message({
    message: m.text,
    id: uid === m.user_id ? 0 : 1,
    senderName: members[m.user_id]?.username || "*system*"
  }))

  // https://github.com/brandonmowat/react-chat-ui
  // isTyping={this.state.is_typing} // Boolean: is the recipient typing
  const bubbleStyles = {
    text: {
      fontSize: 14
    },
    // chatbubble: {
    //   borderRadius: 70,
    //   padding: 40
    // }
  }

  return <div className='chat-feed' ref={el}>
      <ChatFeed
        messages={messages} // Array: list of message objects
        hasInputField={false} // Boolean: use our input, or use your own
        showSenderName // show the name of the user who sent the message
        bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
        // JSON: Custom bubble styles
        bubbleStyles={bubbleStyles}
      />
    </div>
}

export function GroupMessages() {
  let messages = useStoreState(s => s.ws.data['groups/messages/get'])
  let members = useStoreState(s => s.ws.data['groups/members/get']?.obj)

  return <Messages messages={messages} members={members} />
}

export function EntriesMessages() {
  let messages = useStoreState(s => s.ws.data['entries/notes/get'])
  let members = useStoreState(s => s.ws.data['shares/ingress/get']?.obj)

  return <Messages messages={messages} members={members} />
}
