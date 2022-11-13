import { Card, CardContent, CardHeader, Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import * as React from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import {theme} from './Mui'

export default function StyleTest() {
    return <>
        <div>
            <h1>Standard HTML (no MUI applied)</h1>
            <h1>H1</h1>
            <h2>H2</h2>
            <p>Body text</p>
            <ul>
                <li>list item</li>
            </ul>
        </div>

        <hr />

        <Stack 
            spacing={2} 
            margin={5}
        >
            <Typography variant="h1">This is an H1</Typography>
            <Typography variant="h2">This is an H2</Typography>
            <Typography variant="h3">This is an H3</Typography>
            <Typography variant="h4">This is an H4</Typography>
            <Typography variant="h5">This is an H5</Typography>
            <Typography variant="h6">This is an H6</Typography>
            <Typography variant="body1">This is a body1</Typography>
            <Typography variant="body2">This is a body2</Typography>
            <Typography variant="caption">This is a caption</Typography>
            <Card>
                <CardHeader title="Card Header"/>
                <CardContent>
                    Card Content
                </CardContent>
            </Card>

            <Stack 
                direction="row"
            >
                <Button variant="text">Text</Button>
                <Button variant="contained">Contained</Button>
                <Button variant="outlined">Outlined</Button>
            </Stack>
            <Stack sx={{ width: '100%' }} spacing={2}>
                <Alert severity="error">This is an error alert — check it out!</Alert>
                <Alert severity="warning">This is a warning alert — check it out!</Alert>
                <Alert severity="info">This is an info alert — check it out!</Alert>
                <Alert severity="success">This is a success alert — check it out!</Alert>
            </Stack>
        </Stack>
    </>
}