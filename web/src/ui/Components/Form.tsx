import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Menu from "@mui/material/Menu";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import {Controller, ControllerProps, FieldValue, FieldValues, Path, UseFormReturn} from "react-hook-form";
import React, {useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
export * as yup from 'yup';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import TipsIcon from '@mui/icons-material/TipsAndUpdatesOutlined';


export function makeForm(schema, defaults=null, opts={}) {
  return (overrides=null) => useForm({
    resolver: yupResolver(schema),
    defaultValues: overrides || defaults || {},
    ...opts
  })
}

// see examples at https://github.com/Mohammad-Faisal/react-hook-form-material-ui/blob/master/src/form-components/FormInputText.tsx

export function Menu2(props) {
  const [anchorEl, setAnchorEl] = useState(null);
  const {label, options, onChange} = props
  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = (value=null) => {
    setAnchorEl(null);
    if (value) {
      onChange(value)
    }
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls="basic-menu"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {label}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {options.map(o => <MenuItem
          key={o.value}
          onClick={() => handleClose(o.value)}
        >
          {o.label}
        </MenuItem>)}
      </Menu>
    </div>
  );
}


// type TextField2 = ControllerProps & {
//   form: any
//   value?: string
//   onChange?: (value: string) => void
// }
export function TextField2(props) {
  const {name, form, onChange, ...rest} = props
  const className = `textfield-${name}`
  rest.className = rest.className ? `${rest.className} ${className}` : className

  if (!(form || onChange)) {
    throw `{form} or {onChange} required for TextField.${name}`
  }

  // I can't get autoFocus working almost ever, so I'm monkey-patching it
  if (autoFocus) {
    rest.inputRef = (el) => el && setTimeout(() => el.focus(), 1)
  }

  const inputProps = {
    sx: {borderRadius: 2},
    ...(rest.inputProps || {})
  }

  if (!form) {
    return <TextField
      id={`textfield-${name}`}
      fullWidth
      value={rest.value}
      onChange={onChange}
      {...rest} />
  }
  return <Controller
    name={name}
    control={form.control}
    render={({ field, fieldState: {error} }) => {
      function change(e: React.FormEvent<HTMLInputElement>) {
        onChange?.(e)
        field.onChange(e)
      }
      return <TextField
        fullWidth
        InputProps={inputProps}
        id={`textfield-${name}`}
        value={field.value}
        onChange={change}
        error={!!error}
        {...rest}
        helperText={error?.message || rest.helperText}
      />
    }}
  />
}

export function Checkbox2(props) {
  const {name, label, helperText, form, value, onChange, ...rest} = props
  if (!(form || onChange)) {
    throw `{form} or {onChange} required for Checkbox.${name}`
  }

  function renderField({field}) {
    return <Checkbox
      checked={field.value}
      onChange={field.onChange}
      {...rest}
    />
  }

  function renderControl() {
    if (!form) {
      return renderField({field: {value, onChange}})
    }
    return <Controller
      name={name}
      control={form.control}
      render={renderField}
    />
  }

  return <FormControl>
    <FormControlLabel
      label={label}
      control={renderControl()}
    />
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
}

export function Autocomplete2(props) {
  const {name, label, form, options, ...rest} = props

  function renderInput(params) {
    return <TextField {...params} label={label} />
  }

  function renderField({field}) {
    return <Autocomplete
      disablePortal
      value={field.value}
      onChange={(e, data) => field.onChange(data)}
      fullWidth
      options={options}
      renderInput={renderInput}
      {...rest}
    />
  }

  return <Controller
    name={name}
    control={form.control}
    render={renderField}
  />
}

interface Select2<T extends FieldValues> {
  name: Path<T>
  label: string
  form: UseFormReturn<T>
  options: Array<{value: string, label: string}>
  helperText?: React.ReactNode
  className?: string
}
export function Select2<T extends FieldValues>({name, label, form, options, helperText, className}: Select2<T>) {
  return <Controller
    name={name}
    control={form.control}
    render={({field}) => {
      const id = `${name}-select`
      return <FormControl
        fullWidth
        className={id}
      >
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={field.value}
          label={label}
          onChange={field.onChange}
        >
          {options.map(o => (
            <MenuItem
              sx={{
                backgroundColor: "#ffffff",

            }}
              className={`${id}-${o.value}`}
              value={o.value}
            >
              {o.label}
            </MenuItem>
          ))}
        </Select>
        <HelperText2 text={helperText} />
      </FormControl>
    }}
  />
}

function HelperText2({text}: { text?: string | React.ReactNode }) {
  if (!text) {return null}
  return <FormHelperText sx={{color: "#0077C2", fontWeight: 500, mt: 1.5 }}><TipsIcon sx={{fontSize: 18, marginRight: .5}}/>{text}</FormHelperText>
}
