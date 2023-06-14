import TextField from "@mui/material/TextField";
import React, {useState} from "react";
import presets from '../../../../../data/prompts.yml'
import keyBy from "lodash/keyBy";
import Autocomplete from "@mui/material/Autocomplete";

type PromptYml = {key?: string, label: string, prompt: string}
type CategoryYml = {category: string, prompts: PromptYml[]}
const presetsFlat = (presets as CategoryYml[])
  .map(category => category.prompts.map(prompt => ({...prompt, category: category.category})))
  .flat()
const presetsObj = keyBy(presetsFlat, 'key')

type Option = PromptYml

interface Selector {
  prompt: string
  setPrompt: (prompt: string) => void
}

export default function Selector({
  prompt,
  setPrompt,
}: Selector) {
  const [option, setOption] = useState<Option | null>(null)

  return <>
    <Autocomplete
      freeSolo
      fullWidth
      options={presetsFlat}
      groupBy={(option) => option.category}
      getOptionLabel={(option) => option.prompt}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          {option.label}
        </li>
      )}
      value={option}
      onChange={(event, newValue) => {
        setOption(newValue)
        setPrompt(newValue?.prompt || "")
      }}
      renderInput={(params) => <TextField
        {...params}
        label="Choose a preset or write your own"
        multiline
        minRows={2}
      />}
      inputValue={option?.prompt || ''}
      onInputChange={(event, newValue) => {
        setOption({
          category: "",
          label: newValue,
          prompt: newValue,
        })
        setPrompt(newValue || "")
      }}
    />
  </>
}
