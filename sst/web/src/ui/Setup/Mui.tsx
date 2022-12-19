import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import StyledEngineProvider from "@mui/material/StyledEngineProvider";
import {createTheme, ThemeProvider, ThemeOptions} from "@mui/material/styles";

const colors = {
  grey: "#fafafa",
  black: "#000000",
  white: "#ffffff"
}
export const styles = {
  colors,
  spacing: {
    sm: 2,
    md: 4,
    lg: 6,
    xl: 12
  },
  sx: {
    button1: {backgroundColor: "primary.main", color: colors.white, fontFamily: "Poppins"},
    button2: {backgroundColor: "primary.light", color: colors.white, fontFamily: "Poppins"},
    featureIcon: {fontSize: 40, color: "primary.main"}
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#50577A',
      light: '#737894', // '#A7ABBC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A7ABBC', // '#738fa7',
      light: '#b8bbc9', // '#6ba9bb',
    },
    background: {
      paper: '#f0efec', // #fff
      default: '#fafafa'
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
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      fontSize: '4.8rem', 
      lineHeight: '1.3',
      marginBottom: '1.38rem'
    },
    h2: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      fontSize: '3.5rem',
      lineHeight: '1.3',
      marginBottom: '1.38rem'
    },
    h3: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      fontSize: '2.8rem',
      lineHeight: '1.3',
      marginBottom: '1.38rem'
    
    },
    h4: {
      fontWeight: 300,
      fontFamily: 'Poppins',
      fontSize: '1.5rem',
      lineHeight: '1.3'
    },
    h5: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      lineHeight: '1.3',
      fontSize: "2rem"
    },

    h6: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      lineHeight: '1.1',
      fontSize: '1.5rem'
    },

    subtitle1: {
      fontFamily: 'Poppins',
    },
    subtitle2: {
      fontFamily: 'Poppins',
    },
    body1: {
      fontFamily: 'Poppins',
      fontWeight: '300',
      fontSize: "1rem",
      lineHeight: '1.75',
      marginTop: '0rem'
    },
    body2: {
      fontFamily: 'Poppins',
      fontWeight: '100',
      fontSize: "1rem",
      lineHeight: '1.75',
    },
    caption: {
      fontFamily: 'Poppins',
    },
    overline: {
      fontFamily: 'Poppins',
    },
    button: {
      fontFamily: "Poppins",
      fontSize: '0.9rem',
      fontWeight: '400'
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        // colorPrimary: {
        //   backgroundColor: styles.colors.grey,
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
