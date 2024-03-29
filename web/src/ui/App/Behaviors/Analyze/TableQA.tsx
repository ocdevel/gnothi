import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import {TextField2} from "../../../Components/Form.tsx";
import Button from "@mui/material/Button";
import {useStore} from "../../../../data/store";
import React, {useCallback, useState, useEffect, useMemo} from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

export default function TableQA() {
  const send = useStore(useCallback(s => s.send, []))
  const answer = useStore(s => s.res.fields_ask_final?.first?.answer)
  const [query, setQuery] = useState("")
  const sending = useStore(s => s.req.fields_ask_request)
  function submit() {
    send("fields_ask_request", {query})
  }
  return <Card sx={{backgroundColor: "white"}}>
    <CardContent sx={{backgroundColor: "white"}}>
      <Typography variant="body1">Try asking a question about your behaviors</Typography>
      <Stack spacing={2} direction="row">
        <TextField2
          sx={{borderRadius: 3}}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="What behavior impacts mood the most?"
        />
        <Button disabled={sending} onClick={submit} variant="outlined">Submit</Button>
      </Stack>
    </CardContent>
    {answer && <CardContent sx={{backgroundColor: "primary"}}>
      {answer}
    </CardContent>}
  </Card>
}