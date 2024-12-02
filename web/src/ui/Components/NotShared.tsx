import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LockIcon from '@mui/icons-material/Lock'
import Box from '@mui/material/Box'

interface Props {
  feature?: string
}

export default function NotShared({feature}: Props) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="action" />
          <Typography>
            {feature ? `${feature} not shared` : "This feature is not shared"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
