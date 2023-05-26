import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Card from "@mui/material/Card";
import React from "react";
import Button from "@mui/material/Button";
import StarIcon from "@mui/icons-material/StarBorder";
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Box from "@mui/material/Box";
import {Link} from "../../../Components/Link"


export default function View() {
  return <Card sx={{borderRadius: 2, height:"100%", backgroundColor: "white"}}>
    <CardContent sx={{backgroundColor: "white", mx: 5}}>
      <Box
        sx={{display: "flex", alignItems: "center", justifyContent: "center", mt: 2}}
      >
        <RocketLaunchIcon sx={{color: "#50577a", fontSize: 40}}/>
      </Box>
      <Typography mt={1} textAlign="center" fontWeight={500} variant="h4" color="primary" mb={3}>Optimized AI insights coming soon!</Typography>
      <Typography mb={2} variant={"body1"}>This is where you’ll see charts and various insights related to your tracked behaviors. Be sure to continue to track behaviors in the meantime.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>Why is tracking crucial?</Typography>
      <Typography mb={2} variant={"body1"}>It paves the way for AI insights, captivating correlations, and greater awareness—all of these help you decide what’s working, what isn’t, and where you want to go next.</Typography>
 <Typography color="primary" variant={"body1"} fontWeight={500}>Have questions, or want updates?</Typography>
      <Typography mb={2} variant={"body1"}>Stay in the loop, find out how to contribute to this open-source project, and more by connecting with the creators on Discord.</Typography>
    <CardActions sx={{backgroundColor: "white", justifyContent: "flex-end"}}>
        <Link.Button
          variant="outlined"
          color="secondary"
          size="small"
          to="https://discord.gg/TNEvx2YR"
          target="_blank"
        >Connect with the creators</Link.Button>
      </CardActions>
    </CardContent>
  </Card>
}
