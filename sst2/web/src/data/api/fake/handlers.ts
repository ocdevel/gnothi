import {Events, Api, Users, Entries, Tags, Fields, Groups, Insights} from '../../schemas'
import {z} from 'zod'
import {useStore} from '@gnothi/web/src/data/store'

const self = Users.fakeData.self

type Handlers = {
  [k in Events.Events]?: (args0: z.ZodTypeAny, ...args: unknown[]) => void
}

const r = Api.routes

type Passthroughs = {
  [k in Events.Events]? : {
    event: Events.Events
    data: () => object[]
    keyby?: string
  }
}
const passthroughs: Passthroughs = {
  users_get_request: {event: 'users_get_response', data: () => [self], keyby: 'id'},
  tags_list_request: {event: 'tags_list_response', data: () => Tags.fakeData.tags, keyby: 'id'},
  entries_list_request: {event: 'entries_list_response', data: () => Entries.fakeData, keyby: 'id'},
  fields_list_request: {event: 'fields_list_response', data: () => Fields.fakeData.fields, keyby: 'id'},
  fields_entries_list_request: {event: 'fields_entries_list_response', data: () => Fields.fakeData.entries, keyby: 'field_id'},
  groups_list_request: {event: 'groups_list_response', data: () => Groups.fakeData.all, keyby: 'id'},
  groups_get_request: {event: 'groups_get_response', data: () => [Groups.fakeData.gnothi], keyby: 'id'},
  groups_mine_list_request: {event: 'groups_mine_list_response', data: () => Groups.fakeData.mine, keyby: 'id'},
  groups_members_list_request: {event: 'groups_members_list_response', keyby: 'user.id', data: () => Groups.fakeData.members},
}

export const handlers: Handlers = {
  users_everything_request: z.function()
    .args(r.users_everything_request.schemaIn)
    .returns(r.users_everything_request.schemaOut)
    .implement((req) => {
      useStore.getState().send("users_get_request", {})
      useStore.getState().send("tags_list_request", {})
      useStore.getState().send("entries_list_request", {})
      useStore.getState().send("fields_list_request", {})
      useStore.getState().send("fields_entries_list_request", {})
      useStore.getState().send("groups_mine_list_request", {})
    }),
  tags_toggle_request: z.function()
    .args(r.tags_toggle_request.schemaIn)
    .returns(r.tags_toggle_request.schemaOut)
    .implement((req) => {
      // console.log(Tags.fakeData.map(t => t.selected))
      Tags.fakeData.tags = Tags.fakeData.tags.map(tag => ({
        ...tag,
        selected: tag.id === req.id ? !tag.selected : tag.selected
      }))
      useStore.getState().send("tags_list_request", {})
      return []
    }),
  groups_enter_request: z.function().implement(() => {
      useStore.getState().send("groups_get_request", {})
      useStore.getState().send("groups_members_list_request", {})
    })
}

export function handler(
  req: Api.Req,
) {
  if (passthroughs[req.event]) {
    const {event, data, keyby} = passthroughs[req.event as Events.Events]
    useStore.getState().setLastJsonMessage({
      event,
      code: 200,
      error: false,
      data: data(),
      keyby
    })
    return
  }
  const route = Api.routes[req.event]
  if (!route) {return}
  handlers[req.event](req.data)
}
