 import {useStore} from "../../../data/store";
import shallow from "zustand/shallow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export default function Dashboard() {
  const [send, user, fields, entries, values, day, isToday, view, setView] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.fields_entries_list_response?.hash,
    s.behaviors.values,
    s.behaviors.day,
    s.behaviors.isToday,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  function showModal() {
    setView({
      page: "modal",
      view: "overall",
      fid: null
    })
  }

  function renderEmpty() {
    return <Box>
      <Typography>You have no behaviors to track</Typography>
      <Button>Demo this feature</Button>
    </Box>
  }

  function renderList() {
    return <>
      {fields?.ids?.map(id => {
        const field = fields?.hash?.[id]
        return <Typography
          className="behavior"
          key={id}
          onClick={() => setView({page: "modal", view: "edit", fid: id})}
        >
          {field.name}
        </Typography>
      })}
    </>
  }

  return <div className="dashboard">
    {fields?.ids?.length ? renderList() : renderEmpty()}
    <Button
      className="btn-expand"
      variant="contained"
      onClick={showModal}
    >
      Dive Deeper
    </Button>
  </div>
}
