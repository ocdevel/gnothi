import create from 'zustand'
import {appSlice, AppSlice} from './app'
import {ApiSlice, apiSlice} from './api'
import {eventsSlice, EventsSlice} from "./events";

export const useStore = create<
  AppSlice & ApiSlice & EventsSlice
>()((...a) => ({
  ...eventsSlice(...a),
  ...apiSlice(...a),
  ...appSlice(...a),
}))

