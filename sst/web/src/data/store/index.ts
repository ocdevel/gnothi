import create from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import shallow from 'zustand/shallow'
import {appSlice, AppSlice} from './app'
import {ApiSlice, apiSlice} from './api'
import {eventsSlice, EventsSlice} from "./events";

export const useStore = create<
  AppSlice & ApiSlice & EventsSlice
>()(subscribeWithSelector((...a) => ({
  ...eventsSlice(...a),
  ...apiSlice(...a),
  ...appSlice(...a),
})))
