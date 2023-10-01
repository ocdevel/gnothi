import {UseFormReturn} from "react-hook-form";
import {fields_post_request, fields_list_response} from "@gnothi/schemas/fields.ts";
import {Alert2, Stack2} from "../../../../Components/Misc.tsx";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {useState} from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

type CreateProps = {
  isNew: true;
  field?: undefined;
  form: UseFormReturn<fields_post_request>;
};

type UpdateProps = {
  isNew: false;
  field: fields_list_response;
  form: UseFormReturn<fields_post_request>;
};

export type UpsertProps = CreateProps | UpdateProps;

interface WithHelp {
  field: React.ReactNode
  help: React.ReactNode
  helpTitle?: string
}
export function WithHelp({field, help, helpTitle}: WithHelp) {
  const [show, setShow] = useState(false)
  return <Box>
    <Stack2 direction='row' alignItems='center'>
      {field}
      <HelpOutlineIcon style={{cursor:" pointer"}} onClick={() => setShow(!show)}/>
    </Stack2>
    {show && <Alert2 severity="info" title={helpTitle}>{help}</Alert2>}
  </Box>
}