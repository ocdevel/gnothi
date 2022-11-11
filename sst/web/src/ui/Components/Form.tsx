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
import {Controller} from "react-hook-form";
import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
export * as yup from 'yup';

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

export function TextField2(props) {
  const {name, form, onChange, ...rest} = props

  if (!(form || onChange)) {
    throw `{form} or {onChange} required for TextField.${name}`
  }

  function renderField({ field, fieldState: {error} }) {
    function change(e) {
      onChange?.(e)
      field.onChange(e)
    }
    return <TextField
      fullWidth
      id={`textfield-${name}`}
      value={field.value}
      onChange={change}
      error={!!error}
      {...rest}
      helperText={error?.message || rest.helperText}
    />
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
    render={renderField}
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

export function Select2(props) {
  const {name, label, form, options, helperText, ...rest} = props

  function renderField({field}) {
    return <>
      <FormControl fullWidth>
        <InputLabel id={`${name}-select-label`}>{label}</InputLabel>
        <Select
          labelId={`${name}-select-label`}
          id={`${name}-select`}
          value={field.value}
          label={label}
          onChange={field.onChange}
        >
          {options.map(o => <MenuItem value={o.value}>{o.label}</MenuItem>)}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </>
  }

  return <Controller render={renderField} name={name} control={form.control}/>
}
