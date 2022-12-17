import * as React from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    Box,
    Typography,
    Button,
    Alert,
    Stack,
    Grid,
    Divider,
} from "@mui/material";
import {theme} from '../Mui'

export default function Test() {
    return <Stack 
        spacing={10}
        margin={5}
    >

        <Grid container direction="row" spacing={3}>
            <Grid item xs={12} md={3} sx={{backgroundColor: "blue"}}>
                <Typography variant="h1">Grid1</Typography>    
            </Grid>
            <Grid item xs={12} md={6} sx={{backgroundColor: "green"}}>
                <Typography variant="h1">Grid2</Typography>    
            </Grid>
            <Grid item xs={12} md={3} sx={{backgroundColor: "yellow"}}>
                <Typography variant="h1">Grid2</Typography>    
            </Grid>
        </Grid>

        <Stack spacing={2}>
            <Typography variant="h1">This is an H1</Typography>
            <Typography variant="h2">This is an H2</Typography>
            <Typography variant="h3">This is an H3</Typography>
            <Typography variant="h4">This is an H4</Typography>
            <Typography variant="h5">This is an H5</Typography>
            <Typography variant="h6">This is an H6</Typography>
            <Typography variant="body1">This is a body1</Typography>
            <Typography variant="body2">This is a body2</Typography>
            <Typography variant="caption">This is a caption</Typography>
        </Stack>

        <Card>
            <CardHeader title="Card Header"/>
            <CardContent>
                Card Content
            </CardContent>
        </Card>

        <Stack sx={{ width: '100%' }} spacing={2}>
            <Alert severity="error">This is an error alert — check it out!</Alert>
            <Alert severity="warning">This is a warning alert — check it out!</Alert>
            <Alert severity="info">This is an info alert — check it out!</Alert>
            <Alert severity="success">This is a success alert — check it out!</Alert>
        </Stack>


        <Stack spacing={2}>
            <Stack 
                direction="row"
                spacing={2}
            >
                <Button variant="text">Text</Button>
                <Button variant="contained">Contained</Button>
                <Button variant="outlined">Outlined</Button>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Button>Primary</Button>
                <Button disabled>Disabled</Button>
                <Button href="#text-buttons">Link</Button>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Button variant="contained">Contained</Button>
                <Button variant="contained" disabled>
                    Disabled
                </Button>
                <Button variant="contained" href="#contained-buttons">
                    Link
                </Button>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Button variant="outlined">Primary</Button>
                <Button variant="outlined" disabled>
                    Disabled
                </Button>
                <Button variant="outlined" href="#outlined-buttons">
                    Link
                </Button>
            </Stack>
        </Stack>
    </Stack>
}