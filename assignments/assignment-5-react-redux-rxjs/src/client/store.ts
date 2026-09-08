import {
  configureStore,
  createAsyncThunk,
  createSlice,
  isFulfilled,
  isPending,
  isRejected,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit"
import { apolloClient, tokenKey } from "./apollo"
import {
  CATCH_UNO,
  CREATE_GAME,
  DRAW_CARD,
  GAMES,
  GET_GAME,
  JOIN_GAME,
  LOGIN,
  ME,
  PLAY_CARD,
  REGISTER,
  SAY_UNO,
  START_GAME,
} from "./graphql"
import type { AuthPayload, Color, GameSummary, GameView, PublicPlayer } from "./types"

type AppState = {
  player?: PublicPlayer
  games: GameSummary[]
  currentGame?: GameView
  busy: boolean
  error?: string
}

const initialState: AppState = {
  games: [],
  busy: false,
}

function rememberAuth(payload: AuthPayload): AuthPayload {
  if (typeof localStorage !== "undefined") localStorage.setItem(tokenKey, payload.token)
  return payload
}

function required<T>(value: T | null | undefined, label: string): T {
  if (value == null) throw new Error(`GraphQL response did not contain ${label}`)
  return value
}

export const restoreSession = createAsyncThunk<PublicPlayer>("app/restoreSession", async () => {
  try {
    const result = await apolloClient.query<{ me: PublicPlayer }>({ query: ME, fetchPolicy: "network-only" })
    return required(result.data?.me, "me")
  } catch (error) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(tokenKey)
    throw error
  }
})

export const registerUser = createAsyncThunk<AuthPayload, { username: string; password: string }>(
  "app/register",
  async variables => {
    const result = await apolloClient.mutate<{ register: AuthPayload }>({ mutation: REGISTER, variables })
    return rememberAuth(required(result.data?.register, "register"))
  },
)

export const loginUser = createAsyncThunk<AuthPayload, { username: string; password: string }>(
  "app/login",
  async variables => {
    const result = await apolloClient.mutate<{ login: AuthPayload }>({ mutation: LOGIN, variables })
    return rememberAuth(required(result.data?.login, "login"))
  },
)

export const loadGames = createAsyncThunk<GameSummary[]>("app/games", async () => {
  const result = await apolloClient.query<{ games: GameSummary[] }>({ query: GAMES, fetchPolicy: "network-only" })
  return required(result.data?.games, "games")
})

export const openGame = createAsyncThunk<GameView, string>("app/openGame", async id => {
  const result = await apolloClient.query<{ game: GameView }>({ query: GET_GAME, variables: { id }, fetchPolicy: "network-only" })
  return required(result.data?.game, "game")
})

export const createGame = createAsyncThunk<GameView, { name: string; maxPlayers: number }>(
  "app/createGame",
  async variables => {
    const result = await apolloClient.mutate<{ createGame: GameView }>({ mutation: CREATE_GAME, variables })
    return required(result.data?.createGame, "createGame")
  },
)

export const joinGame = createAsyncThunk<GameView, string>("app/joinGame", async gameId => {
  const result = await apolloClient.mutate<{ joinGame: GameView }>({ mutation: JOIN_GAME, variables: { gameId } })
  return required(result.data?.joinGame, "joinGame")
})

export const startGame = createAsyncThunk<GameView, string>("app/startGame", async gameId => {
  const result = await apolloClient.mutate<{ startGame: GameView }>({ mutation: START_GAME, variables: { gameId } })
  return required(result.data?.startGame, "startGame")
})

export const playCard = createAsyncThunk<GameView, { gameId: string; cardIndex: number; color?: Color }>(
  "app/playCard",
  async variables => {
    const result = await apolloClient.mutate<{ playCard: GameView }>({ mutation: PLAY_CARD, variables })
    return required(result.data?.playCard, "playCard")
  },
)

export const drawCard = createAsyncThunk<GameView, string>("app/drawCard", async gameId => {
  const result = await apolloClient.mutate<{ drawCard: GameView }>({ mutation: DRAW_CARD, variables: { gameId } })
  return required(result.data?.drawCard, "drawCard")
})

export const sayUno = createAsyncThunk<GameView, string>("app/sayUno", async gameId => {
  const result = await apolloClient.mutate<{ sayUno: GameView }>({ mutation: SAY_UNO, variables: { gameId } })
  return required(result.data?.sayUno, "sayUno")
})

export const catchUno = createAsyncThunk<GameView, { gameId: string; accusedPlayerId: string }>(
  "app/catchUno",
  async variables => {
    const result = await apolloClient.mutate<{ catchUno: GameView }>({ mutation: CATCH_UNO, variables })
    return required(result.data?.catchUno, "catchUno")
  },
)

const asyncOperations = [
  restoreSession,
  registerUser,
  loginUser,
  loadGames,
  openGame,
  createGame,
  joinGame,
  startGame,
  playCard,
  drawCard,
  sayUno,
  catchUno,
] as const

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    gameUpdated(state, action: PayloadAction<GameView>) {
      if (state.currentGame?.id === action.payload.id) state.currentGame = action.payload
    },
    leaveGameView(state) {
      state.currentGame = undefined
      state.error = undefined
    },
    setClientError(state, action: PayloadAction<string>) {
      state.error = action.payload
    },
    clearError(state) {
      state.error = undefined
    },
    loggedOut() {
      return initialState
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => { state.player = action.payload })
      .addCase(registerUser.fulfilled, (state, action) => { state.player = action.payload.player })
      .addCase(loginUser.fulfilled, (state, action) => { state.player = action.payload.player })
      .addCase(loadGames.fulfilled, (state, action) => { state.games = action.payload })
      .addCase(openGame.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(createGame.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(joinGame.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(startGame.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(playCard.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(drawCard.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(sayUno.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addCase(catchUno.fulfilled, (state, action) => { state.currentGame = action.payload })
      .addMatcher(isPending(...asyncOperations), state => {
        state.busy = true
        state.error = undefined
      })
      .addMatcher(isFulfilled(...asyncOperations), state => {
        state.busy = false
      })
      .addMatcher(isRejected(...asyncOperations), (state, action) => {
        state.busy = false
        state.error = action.error.message ?? "Request failed"
      })
  },
})

export const store = configureStore({ reducer: appSlice.reducer })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>

export const { gameUpdated, leaveGameView, setClientError, clearError } = appSlice.actions

export function logout(): AppThunk {
  return dispatch => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(tokenKey)
    void apolloClient.clearStore()
    dispatch(appSlice.actions.loggedOut())
  }
}
