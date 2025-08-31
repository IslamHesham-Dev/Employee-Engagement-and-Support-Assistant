import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import surveyReducer from './surveySlice';
import userReducer from './userSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        survey: surveyReducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;




