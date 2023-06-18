import {
  Link as Link_,
  LinkProps
} from 'react-router-dom'
import Button_, {ButtonProps} from '@mui/material/Button'

export * as Link from './Link'

export function Anchor(props: LinkProps) {
  return <Link_ {...props} />
}

export function Button(props: ButtonProps & LinkProps) {
  const {to, ...rest} = props
  return <Button_ {...rest} component={Link_} to={to} />
}

// TODO Button
// TODO Nav
// TODO Tab
