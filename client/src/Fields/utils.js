import React from 'react'
import strip from 'strip-markdown'
import ReactMarkdown from "react-markdown"
import emoji from 'remark-emoji'

// see https://github.com/remarkjs/strip-markdown/blob/main/index.js
const options = {keep: [
  // 'heading',
  'text',
  'inlineCode',
  'image',
  'imageReference',
  // 'break',

  'blockquote',
  // 'list',
  // 'listItem',
  'strong',
  'emphasis',
  'delete',
  'link',
  'linkReference',

  'code',
  // 'horizontalRule',
  // 'thematicBreak',
  // 'html',
  // 'table',
  // 'tableCell',
  // 'definition',
  // 'yaml',
  // 'toml'
]}


export function FieldName({name, maxWidth=null}) {
  // https://css-tricks.com/snippets/css/truncate-string-with-ellipsis/
  const style = {whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}
  if (maxWidth) { style['maxWidth'] = maxWidth }

  return <div style={style}>
    <ReactMarkdown
      plugins={[[strip, options], emoji]}
      source={name}
      escapeHtml={true}
      linkTarget={'_blank'}
    />
  </div>
}
