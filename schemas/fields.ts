import {z} from 'zod'
import {Passthrough, IdCol, dateCol, CoerceNumber} from './utils'
import {Route} from './api'
export * as Fields from './fields'
import {influencers} from '@gnothi/services/data/schemas/influencers'
import {v4 as uuid} from 'uuid'
import {fields} from '@gnothi/services/data/schemas/fields'
import {createSelectSchema, createInsertSchema} from 'drizzle-zod'

const fieldsInsertSchema = createInsertSchema(fields)

export const Field = fieldsInsertSchema.extend({
  // created_at: dateCol().default(() => new Date()),
  // Add the templates, since they're only client-side
  type: z.enum(["number", "fivestar", "check", "option", "habit", "daily", "todo", "reward"]).default("fivestar"),
  // drizzle-zod doesn't pick up default values from fields, which is needed or react-hook-form
  // need to extend all these to add the default
  score: CoerceNumber.default(0),
  analyze_enabled: fieldsInsertSchema.shape.analyze_enabled.default(true),
  default_value: fieldsInsertSchema.shape.default_value.default("value"),
  reset_period: fieldsInsertSchema.shape.reset_period.default("daily"),
  score_up_good: fieldsInsertSchema.shape.score_up_good.default(true)

  // user_id: z.string().uuid(), // FK users.id
})
export type Field = z.infer<typeof Field>

export const FieldEntry = z.object({
  // day & field_id may be queries independently, so compound primary-key not enough - index too
  field_id: IdCol,
  day: dateCol(),

  created_at: dateCol(),
  value: CoerceNumber.default(0),
  user_id: IdCol,
})
export type FieldEntry = z.infer<typeof FieldEntry>

export const fields_post_request = Field.omit({
  id: true,
  created_at: true,
  updated_at: true,
  service: true,
  service_id: true,
  user_id: true,
  influencer_score: true,
  next_pred: true,
  avg: true,
  score_total: true,
  score_period: true,
  streak: true,
})
export type fields_post_request = z.infer<typeof fields_post_request>
export const fields_put_request = fields_post_request.extend({
  id: IdCol,
})
export type fields_put_request = z.infer<typeof fields_put_request>


export const fields_list_request = Passthrough
export type fields_list_request = z.infer<typeof fields_list_request>
export const fields_list_response = Field
export type fields_list_response = z.infer<typeof fields_list_response>

export const fields_sort_request = z.object({
  id: IdCol,
  sort: z.number()
}).array()
export type fields_sort_request = z.infer<typeof fields_sort_request>
export const fields_sort_response = fields_list_response
export type fields_sort_response = z.infer<typeof fields_sort_response>

export const fields_entries_list_request = z.object({
  day: dateCol().optional()
})
export type fields_entries_list_request = z.infer<typeof fields_entries_list_request>
export const fields_entries_list_response = FieldEntry
export type fields_entries_list_response = z.infer<typeof fields_entries_list_response>
export const fields_entries_post_request = FieldEntry.pick({
  field_id: true,
  day: true,
  value: true
})
export const fields_delete_request = z.object({
  id: IdCol
})
export type fields_delete_request = z.infer<typeof fields_delete_request>
// export const fields_delete_response = fields_delete_request
// export type fields_delete_response = z.infer<typeof fields_delete_response>

export type fields_entries_post_request = z.infer<typeof fields_entries_post_request>
export const fields_entries_post_response = fields_entries_list_response
export type fields_entries_post_response = z.infer<typeof fields_entries_post_response>

export const fields_exclude_request = z.object({
  id: IdCol,
  exclude: z.boolean()
})
export type fields_exclude_request = z.infer<typeof fields_exclude_request>

export const fields_influencers_list_request = createSelectSchema(influencers)
export type fields_influencers_list_request = z.infer<typeof fields_influencers_list_request>

export const fields_history_list_request = z.object({
  id: z.string()
})
export type fields_history_list_request = z.infer<typeof fields_history_list_request>
export const fields_history_list_response = FieldEntry.pick({value: true, created_at: true})
export type fields_history_list_response = z.infer<typeof fields_history_list_response>

export const habitica_post_request = z.object({
  habitica_user_id: z.string().optional(),
  habitica_api_token: z.string().optional(),
})

export const fields_ask_request = z.object({
  query: z.string()
})
export type fields_ask_request = z.infer<typeof fields_ask_request>
export const fields_ask_response = fields_ask_request.extend({
  user_id: z.string(),
})
export type fields_ask_response = z.infer<typeof fields_ask_response>
export const fields_ask_final = z.object({
  id: z.string(),
  answer: z.string()
})
export type fields_ask_final = z.infer<typeof fields_ask_final>


export const routes = {
  fields_list_request: {
    i: {
      e: 'fields_list_request',
      s: fields_list_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: 'fields_list_response',
      s: fields_list_response,
      t: {ws: true},
      keyby: "id"
    }
  },
  fields_post_request: {
    i: {
      e: 'fields_post_request',
      s: fields_post_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'fields_post_response',
      s: fields_list_response,
      t: {ws: true},
      event_as: 'fields_list_response',
      op: 'append',
      keyby: "id"
    }
  },
  fields_put_request: {
    i: {
      e: 'fields_put_request',
      s: fields_put_request,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      e: 'fields_put_response',
      s: fields_list_response,
      t: {ws: true},
      event_as: 'fields_list_response',
      op: "update",
      keyby: "id"
    }
  },
  fields_delete_request: {
    i: {
      e: "fields_delete_request",
      s: fields_delete_request,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      e: "fields_delete_response",
      s: fields_list_response,
      event_as: "fields_list_response",
      op: "delete",
      keyby: "id"
    }
  },
  fields_sort_request: {
    i: {
      e: "fields_sort_request",
      s: fields_sort_request,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      e: "fields_sort_response",
      s: fields_sort_response,
      t: {ws: true},
      event_as: "fields_list_response",
      // op: "update",
      keyby: "id"
    }
  },

  fields_entries_list_request: {
    i: {
      e: 'fields_entries_list_request',
      s: Passthrough,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: 'fields_entries_list_response',
      s: fields_entries_list_response,
      t: {ws: true},
      keyby: 'field_id',
    }
  },

  fields_exclude_request: {
    i: {
      e: "fields_exclude_request",
      s: fields_exclude_request,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      e: 'fields_exclude_response',
      s: fields_list_response,
      t: {ws: true},
      event_as: 'fields_list_response',
      op: "update",
      keyby: "id"
    }
  },

  fields_entries_post_request: {
    i: {
      e: 'fields_entries_post_request',
      s: fields_entries_post_request, // {field_id: 1, day: '2020-01-01', value: 1}
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'fields_entries_post_response',
      s: fields_entries_post_response,
      t: {ws: true},
      keyby: 'field_id',
      op: "update",
      event_as: 'fields_entries_list_response'
    }
  },

  fields_influencers_list_request: {
    i: {
      e: "fields_influencers_list_request",
      s: Passthrough,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "fields_influencers_list_response",
      s: fields_influencers_list_request,
      t: {ws: true},
      // DON'T KEY BY! Or add an arbitrary id to each row.
      // Will collect on the client side.
      // keyby: "field_id",
    }
  },

  fields_history_list_request: {
    i: {
      e: "fields_history_list_request",
      s: fields_history_list_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "fields_history_list_response",
      s: fields_history_list_response,
      t: {ws: true},
    }
  },

  habitica_post_request: {
    i: {
      e: 'habitica_post_request',
      s: habitica_post_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'habitica_post_response',
      s: z.void(),
      t: {ws: true},
    },
  },
  habitica_delete_request: {
    i: {
      e: 'habitica_delete_request',
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'void',
      s: z.void(),
      t: {ws: true},
    }
  },
  habitica_sync_request: {
    i: {
      e: 'void',
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'void',
      s: z.void(),
      t: {ws: true},
    }
  },
  fields_cron: {
    i: {
      e: 'void',
      s: Passthrough,
      t: {cron: true},
    },
    o: {
      e: 'void',
      s: z.void(),
      t: {cron: true},
    }
  },

  fields_ask_request: {
    i: {
      e: 'fields_ask_request',
      s: fields_ask_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: 'fields_ask_response',
      s: fields_ask_response,
      t: {ws: true, background: true},
    }
  },
  fields_ask_response: {
    i: {
      e: 'fields_ask_response',
      s: fields_ask_response,
      t: {background: true},
    },
    o: {
      e: 'fields_ask_final',
      s: fields_ask_final,
      clears: "fields_ask_request",
      t: {ws: true},
    }
  }

}
