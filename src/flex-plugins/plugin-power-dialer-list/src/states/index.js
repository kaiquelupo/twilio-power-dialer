import { combineReducers } from 'redux';

import { reduce as CustomTaskListReducer } from './CustomTaskListState';

// Register your redux store under a unique namespace
export const namespace = 'power-dialer-list';

// Combine the reducers
export default combineReducers({
  customTaskList: CustomTaskListReducer
});
