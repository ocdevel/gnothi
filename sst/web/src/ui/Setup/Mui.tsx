import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import StyledEngineProvider from "@mui/material/StyledEngineProvider";
import {createTheme, ThemeProvider, ThemeOptions} from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: '#50577A',
      light: '#A7ABBC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#738fa7',
      light: '#6ba9bb',
    },
    background: {
      paper: '#f0efec',
    },
    text: {
      primary: '#071330',
    },
    error: {
      main: '#dc6783',
    },
    warning: {
      main: '#dc6783',
    },
    success: {
      main: '#50dece',
    },
  },
  typography: {
    fontFamily: 'Poppins',
    h1: {
      //fontWeight: 800,
      fontFamily: 'Antic Didone',
    },
    h2: {
      fontFamily: 'Antic Didone',
      //fontWeight: 1000,
    },
    h3: {
      //fontWeight: 700,
    },
    h5: {
      //fontWeight: 900,
    },
    subtitle1: {
      fontFamily: 'Poppins',
    },
    subtitle2: {
      fontFamily: 'Poppins',
    },
    body1: {
      fontFamily: 'Poppins',
    },
    body2: {
      fontFamily: 'Poppins',
    },
    caption: {
      fontFamily: 'Poppins',
    },
    overline: {
      fontFamily: 'Poppins',
    },
    button: {
      fontFamily: "Poppins"
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        // colorInherit: {
        //   backgroundColor: '#738fa7',
        //   color: '#fff',
        // },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'initial',
          borderRadius: 20,
          elevation: 12,
        },
      },
    },
  },
  // props: {
  //   MuiAppBar: {
  //     color: 'inherit',
  //   },
  // },
})

export default function Mui({children}: React.PropsWithChildren<{}>) {
  // return <StyledEngineProvider injectFirst>
  //   <CssBaseline />
  //   {children}
  // </StyledEngineProvider>

  return <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
}
