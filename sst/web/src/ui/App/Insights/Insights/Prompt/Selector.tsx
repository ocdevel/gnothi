import TextField from "@mui/material/TextField";
import React, {useState} from "react";
import presets from '../../../../../data/prompts.yml'
import keyBy from "lodash/keyBy";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

console.log(presets)

const presetsFlat = presets
  .map(category => category.prompts.map(prompt => ({ ...prompt, category: category.category })))
  .flat();
const presetsObj = keyBy(presetsFlat, 'key')


// type Preset = keyof typeof promptsObj
type Preset = {
  key: string
  label: string
  prompt: string
}

interface Selector {
  prompt: string
  setPrompt: (prompt: string) => void
  teaser?: boolean
}
export default function Selector({prompt, setPrompt, teaser}: Selector) {
  const [preset, setPreset] = useState<Preset | null>(null)

  function editPreset() {
    setPreset(presetsObj.custom)
  }

  return <>
    <Autocomplete
       fullWidth
       options={presetsFlat}
       groupBy={(option) => option.category}
       getOptionLabel={(option) => option.label}
       value={preset}
       onChange={(e, val) => {
         setPreset(val)
         setPrompt(val?.prompt || "")
       }}
       renderInput={(params) => (
         <TextField {...params} label="Journal prompts" />
       )}
    />
    {preset?.key === "custom" ? <TextField
      fullWidth={true}
      sx={{
        '& fieldset': {
          borderRadius: 3,
        },
      }}
      id="outlined-multiline-flexible"
      label="Prompt"
      multiline
      value={prompt}
      onChange={e => setPrompt(e.target.value)}
      minRows={4}
      maxRows={8}
      // helperText="Enter a prompt, with <placeholder> values like so: Interpret the following dream <paragraphs>"
    /> : <Typography
      color="text.secondary"
      sx={{cursor: "pointer"}}
      onClick={editPreset}
    >
      {prompt}
    </Typography>}
  </>
}
