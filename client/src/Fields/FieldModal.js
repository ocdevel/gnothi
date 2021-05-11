import React, {useState} from "react";
import _ from "lodash";
import {BasicDialog} from "../Helpers/Dialog";

import {useStoreActions, useStoreState} from "easy-peasy";
import {DialogActions, DialogContent, Button, Grid} from "@material-ui/core";
import {yup, makeForm, TextField2, Checkbox2, Autocomplete2, Select2} from "../Helpers/Form";

const schema = yup.object().shape({
  name: yup.string().min(1),
  type: yup.string(),
  default_value: yup.string(),
  default_value_value: yup.string().nullable(),
})
const defaults = {name: '', type: 'number', default_value: 'value', default_value_value: ''}
const useForm = makeForm(schema, defaults)

export default function FieldModal({close, field= {}}) {
  const emit = useStoreActions(a => a.ws.emit)
  const form = useForm(field.id ? field : null)

  const fid = field && field.id
  const [type, default_value] = form.watch(['type', 'default_value'])

  function submit(data) {
    if (_.isEmpty(data.default_value_value)) {
      data.default_value_value = null
    }
    if (fid) {
       emit(['fields/field/put', {id: fid, ...data}])
    } else {
       emit(['fields/fields/post', data])
    }

    close()
  }

  const destroyField = async () => {
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    emit(['fields/field/delete', {id: fid}])
    close()
  }

  const excludeField = async (exclude=true) => {
    const body = {excluded_at: exclude ? new Date() : null}
    emit(['fields/field/exclude', {id: fid, body}])
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
            <TextField2 name='name' label="Name" form={form} />
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
        <Button color="primary" variant="contained" onClick={form.handleSubmit(submit)}>Save</Button>
      </DialogActions>
    </BasicDialog>
  )
}
