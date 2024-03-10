import TextField from "@mui/material/TextField";
import React, {useState} from "react";
import keyBy from "lodash/keyBy";
import Autocomplete from "@mui/material/Autocomplete";
import {useStore} from "../../../../../data/store";
import {useShallow} from "zustand/react/shallow";
import {PromptYml, CategoryYml, presetsFlat, presetsObj} from "../../../../../../../schemas/promptPresets.ts";

interface Selector {
  prompt: PromptYml | null
  setPrompt: (prompt: PromptYml | null) => void
}
export default function Selector({
  prompt,
  setPrompt,
}: Selector) {
  const [premium] = useStore(useShallow(s => [
    s.user?.me?.premium
  ]))

  const label = premium ? "Choose a preset or write your own" : "Choose a prompt"
  return <>
    <Autocomplete
      freeSolo={premium}
      fullWidth
      options={presetsFlat}
      groupBy={(option) => option.category}
      getOptionLabel={(option) => option.prompt}
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          {option.label}
        </li>
      )}
      value={prompt}
      onChange={(event, newValue) => {
        setPrompt(newValue)
      }}
      renderInput={(params) => <TextField
        {...params}
        label={label}
        multiline
        minRows={2}
      />}
      inputValue={prompt?.prompt || ''}
      onInputChange={(event, newValue) => {
        setPrompt({
          category: "",
          key: "custom",
          label: newValue,
          prompt: newValue,
        })
      }}
    />
  </>
}
