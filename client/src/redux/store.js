import { createStore, applyMiddleware } from 'redux'
import mainReducer from './reducer'
import thunk from 'redux-thunk';
// import { composeWithDevTools } from 'redux-devtools-extension';

// export default createStore(chatReducer, composeWithDevTools(applyMiddleware(thunk)));
export default createStore(mainReducer, applyMiddleware(thunk));
