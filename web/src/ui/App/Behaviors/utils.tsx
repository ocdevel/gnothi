import React from 'react'
import strip from 'strip-markdown'
import ReactMarkdown from "react-markdown"
import emoji from 'remark-emoji'
import Box from "@mui/material/Box";
import dayjs from "dayjs";

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


interface FieldName {
  name: string
  maxWidth?: number | "${number}%"
}
export function FieldName({name, maxWidth}: FieldName) {
  // https://css-tricks.com/snippets/css/truncate-string-with-ellipsis/
  return <Box
    sx={{
      fontWeight: 500,
      color: "primary.main",
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth
    }}
  >
    <ReactMarkdown
      className='react-markdown'
      remarkPlugins={[[strip, options], emoji]}
      skipHtml={true}
      linkTarget={'_blank'}
    >
      {name}
    </ReactMarkdown>
  </Box>
}
