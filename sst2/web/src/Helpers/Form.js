import Autocomplete from "@material-ui/core/Autocomplete";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Menu from "@material-ui/core/Menu";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
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
      value={field.value}
      onChange={change}
      error={!!error}
      {...rest}
      helperText={error?.message || rest.helperText}
    />
  }

  if (!form) {
    return <TextField
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
