import {action, createStore} from 'easy-peasy'
import {store as user} from './user'
import {store as insights} from './insights'
import {store as server} from './server'
import {store as groups} from './groups'
import {store as j} from './journal'

const store = createStore({
  user,
  insights,
  server,
  groups,
  j
})

export default store


