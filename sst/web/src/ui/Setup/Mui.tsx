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
    
    featureIcon: {fontSize: 40, color: "#50627a"},
    behaviorIcon: {fontSize: 40, color: "#507a6f"},
    bookIcon: {fontSize: 40, color: "#553840"},

    promptIconLg: {fontSize: 60, color: "#50627a"},
    behaviorIconLg: {fontSize: 60, color: "#507a6f"},
    organizationIconLg: {fontSize: 60, color: '#696B38'},
    booksIconLg: {fontSize: 60, color: '#7B515C'},
    themesSummariesIconLg: {fontSize: 60, color: "#59547a"}
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
    // custom: {
    //   light: "#ffffff"
    // },
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
      lineHeight: '1.1',
      marginBottom: '1rem'
     
    },
    h2: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      fontSize: '3rem',
      lineHeight: '1.3',
      marginBottom: '1rem'
    },
    h3: {
      fontWeight: 500,
      fontFamily: 'Poppins',
      fontSize: '1.5rem',
      lineHeight: '1.3',    
    },
    h4: {
      fontWeight: 200,
      fontFamily: 'Poppins',
      fontSize: '1.5rem',
      lineHeight: '1.5',
      marginBottom: '1rem'
    },
    h5: {
      fontWeight: 400,
      fontFamily: 'Antic Didone',
      lineHeight: '1.3',
      fontSize: "2rem"
    },

    h6: {
      fontWeight: 700,
      fontFamily: 'Poppins',
      lineHeight: '1.3',
      fontSize: '1rem',
    },
    
    subtitle1: {
      fontFamily: 'Poppins',
      fontSize: '1.6rem'
    },
    subtitle2: {
      fontFamily: 'Poppins',
    },
    body1: {
      fontFamily: 'Poppins',
      fontWeight: '300',
      fontSize: "1rem",
      lineHeight: '1.6',
      marginTop: '0rem'
    },
    body2: {
      fontFamily: 'Poppins',
      fontWeight: '200',
      fontSize: "0.8rem",
      lineHeight: '1.7',
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
