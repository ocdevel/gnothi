import {action, createStore} from 'easy-peasy'
import {store as user} from './user'
import {store as insights} from './insights'
import {store as server} from './server'
import {store as ws} from './ws'

const store = createStore({
  user,
  insights,
  server,
  ws
})

export default store


