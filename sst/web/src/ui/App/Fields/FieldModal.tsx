import React, {useState} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import {TextField2, Select2} from "@gnothi/web/src/ui/Components/Form";
import {useForm, Controller} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import * as S from "@gnothi/schemas"

interface FieldModal {
  close: (what?: boolean) => void
  field?: S.Fields.Field
}
export default function FieldModal({close, field}: FieldModal) {
  const editing = !!field?.id
  field = editing ? field : S.Fields.fields_post_request.omit({name: true}).parse({})
  const send = useStore(s => s.send)
  const form = useForm({
    resolver: zodResolver(S.Fields.Field),
    defaultValues: field
  })

  console.log(form.formState.errors)

  const fid = editing && field.id
  const [type, default_value] = form.watch(['type', 'default_value'])

  function submit(data: Partial) {
    console.log({data})
    if (fid) {
       send('fields_put_request', {id: fid, ...data})
    } else {
       send('fields_post_request', data)
    }

    close()
  }

  const destroyField = async () => {
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    send('fields_delete_request', {id: fid})
    close()
  }

  const excludeField = async (exclude=true) => {
    const body = {excluded_at: exclude ? new Date() : null}
    send('fields_exclude_request', {id: fid, body})
    close(false)
  }

  let defValHelp = {
    value: `Auto-populate this field with "Default Value". Leaving it empty is valid (blanks are considered by ML models)`,
    ffill: `Pulls the value from your last entry for this field`,
    average: `Uses your average accross entries for this field`
  }
  const lastEntry = fid && _.last(field.history)
  if (lastEntry) { // only show if have values to work with
    defValHelp.ffill += ` (currently ${lastEntry.value})`
    defValHelp.average += ` (currently ${field.avg})`
  }
  defValHelp = defValHelp[default_value]

  return (
    <BasicDialog
      size="large"
      open={true}
      onClose={close}
      title={fid ? "Edit Field" : "New Field"}
    >
      <DialogContent>
        <Grid container spacing={2} direction='column' sx={{minWidth:400}}>
          <Grid item>
            <TextField2
              name='name'
              label="Name"
              className='input-fields-field-name'
              form={form}
            />
          </Grid>
          <Grid item>
            <Select2
              name='type'
              label="Field Type"
              form={form}
              options={[
                {value: 'number', label: "Number"},
                {value: 'fivestar', label: "Fivestar"},
                {value: 'check', label: "Check"},
              ]}
            />
          </Grid>
          <Grid item>
            <Select2
              name='default_value'
              label="Field Default"
              form={form}
              options={[
                {value: 'value', label: "Specific value (including empty)"},
                {value: 'ffill', label: "Pull entry from yesterday"},
                {value: 'average', label: "Average of your entries"},
              ]}
              helperText={defValHelp}
            />
          </Grid>
          {default_value === 'value' && (
            <Grid item>
              <TextField2
                name='default_value_value'
                className="input-fields-field-default_value_value"
                label="Default Value"
                type="number"
                form={form}
                min={type === 'check' ? 0 : null}
                max={type === 'check' ? 1 : null}
              />
            </Grid>
          )}
        </Grid>

        {fid && (
          <>
            <hr/>
            <div className='mb-3'>
              <Button
                color='secondary'
                disabled={field.service}
                onClick={destroyField}
                size='small'
              >Delete</Button>
              <br/>
              <small
                style={field.service ? {textDecoration: 'line-through'}: {}}
                className='text-muted'
              >
                Permenantly delete this field and all its entries
              </small>
              {field.service && <>
                <br/>
                <small className='text-muted'>Delete this field at the source. To exclude from Gnothi, click "Remove".</small>
              </>}

            </div>
            <div>
              {field.excluded_at ? (
                <>
                <Button
                  color='secondary'
                  onClick={() => excludeField(false)}
                  size='small'
                >Include</Button>
                <br/>
                <small className='text-muted'>Bring this field back</small>
                </>
              ) : (
                <>
                <Button
                  color='secondary'
                  onClick={() => excludeField(true)}
                  size='small'
                >Remove</Button>
                <br/>
                <small className='text-muted'>Don't delete this field, but exclude it from showing up starting now. Fewer fields means easier machine learning. Consider "Remove"-ing irrelevant imported fields.</small>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={close}>Cancel</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={form.handleSubmit(submit)}
          className="button-fields-field-post"
        >
          Save
        </Button>
      </DialogActions>
    </BasicDialog>
  )
}
