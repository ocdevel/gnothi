import {useStoreActions} from "easy-peasy";
import MdEditor from "react-markdown-editor-lite";
import React from "react";
import MarkdownIt from "markdown-it";
import {Controller} from "react-hook-form";

const mdParser = new MarkdownIt(/* Markdown-it options */);

// https://github.com/HarryChen0506/react-markdown-editor-lite/blob/master/docs/plugin.md
const plugins = [
  'header',
  'font-bold',
  'font-italic',
  'font-underline',
  'font-strikethrough',
  'list-unordered',
  'list-ordered',
  'block-quote',
  'image',
  'link',
  'mode-toggle',
  'full-screen',
  // f3b13052: auto-resize
]

export default function Editor(props) {
  const fetch = useStoreActions(actions => actions.server.fetch)
  const {name, form, onChange, ...rest} = props

  async function onImageUpload(file) {
    const formData = new FormData();
    // formData.append('file', file, file.filename);
    formData.append('file', file);
    const headers = {'Content-Type': 'multipart/form-data'}
    const {data, code} = await fetch({route: 'upload-image', method: 'POST', body: formData, headers})
    return data.filename
  }

  function change(field, text) {
    onChange?.(text)
    field.onChange(text)
  }

  return <Controller
    name={name}
    control={form.control}
    render={({field}) => <MdEditor
      plugins={plugins}
      value={field.value}
      style={{ height: 300, width: '100%' }}
      config={{view: { menu: true, md: true, html: false }}}
      renderHTML={(text) => mdParser.render(text)}
      onChange={({text}) => change(field, text)}
      onImageUpload={onImageUpload}
      {...rest}
    />}
  />
}
