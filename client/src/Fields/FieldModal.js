import React, {useState} from "react";
import _ from "lodash";
import {Form} from "react-bootstrap";
import {BasicDialog} from "../Helpers/Dialog";

import {useStoreActions, useStoreState} from "easy-peasy";
import {DialogActions, DialogContent, Button} from "@material-ui/core";

export default function FieldModal({close, field= {}}) {
  const emit = useStoreActions(a => a.ws.emit)

  const form_ =
    field.id ? _.pick(field, ['name', 'type', 'default_value', 'default_value_value'])
    : {name: '', type: 'number', default_value: 'value', default_value_value: ''}

  const [form, setForm] = useState(form_)

  const fid = field && field.id

  const saveField = async e => {
    // e.preventDefault()
    const body = {
      name: form.name,
      type: form.type,
      default_value: form.default_value,
      default_value_value: _.isEmpty(form.default_value_value) ? null : form.default_value_value,
    }
    if (fid) {
       emit(['fields/field/put', {id: fid, ...body}])
    } else {
       emit(['fields/fields/post', body])
    }

    close()
  }

  const changeText = k => e => setForm({...form, [k]: e.target.value})
  const changeCheck = k => e => setForm({...form, [k]: e.target.checked})

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
  defValHelp = defValHelp[form.default_value]

  return (
    <BasicDialog
      size="large"
      open={true}
      onClose={close}
      title={fid ? "Edit Field" : "New Field"}
    >
      <DialogContent>
        <Form.Group controlId="formFieldName">
          <Form.Label>Field Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={changeText('name')}
          />
        </Form.Group>

        <Form.Group controlId="formFieldType">
          <Form.Label>Field Type</Form.Label>
          <Form.Control
            as="select"
            value={form.type}
            onChange={changeText('type')}
          >
            <option>number</option>
            <option>fivestar</option>
            <option>check</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formFieldDefault">
          <Form.Label>Field Default</Form.Label>
          <Form.Control
            as="select"
            value={form.default_value}
            onChange={changeText('default_value')}
          >
            <option value="value">Specific value (including empty)</option>
            <option value="ffill">Pull entry from yesterday</option>
            <option value="average">Average of your entries</option>
          </Form.Control>
          <Form.Text className="text-muted">
            {defValHelp}
          </Form.Text>
        </Form.Group>

        {form.default_value === 'value' && (
          <Form.Group controlId="formFieldDefaultValue">
            <Form.Label>Default Value</Form.Label>
            <Form.Control
              type="number"
              min={form.type === 'check' ? 0 : null}
              max={form.type === 'check' ? 1 : null}
              value={form.default_value_value}
              onChange={changeText('default_value_value')}
            />
          </Form.Group>
        )}

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
        <Button color="primary" variant="contained" onClick={saveField}>Save</Button>
      </DialogActions>
    </BasicDialog>
  )
}
