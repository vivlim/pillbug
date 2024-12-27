import { apiSlice, NormalizedStatus } from './features/api/apiSlice'
import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit'
import { entityGraphSlice } from './features/entityGraph/entityGraphSlice'

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        entityGraph: entityGraphSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
})

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Same for the `RootState` type
export type RootState = ReturnType<typeof store.getState>
// Export a reusable type for handwritten thunks
export type AppThunk = ThunkAction<void, RootState, unknown, Action>


export async function getSingleStatus(id: string): Promise<NormalizedStatus | undefined> {
    const result = await store.dispatch(apiSlice.endpoints.getStatus.initiate(id));
    return result.data
}