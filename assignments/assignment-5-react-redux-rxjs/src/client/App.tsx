import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"
import { tokenKey } from "./apollo"
import { gameUpdates$ } from "./live"
import {
  catchUno,
  createGame,
  drawCard,
  gameUpdated,
  joinGame,
  leaveGameView,
  loadGames,
  loginUser,
  logout,
  openGame,
  playCard,
  registerUser,
  restoreSession,
  sayUno,
  setClientError,
  startGame,
  type AppDispatch,
  type RootState,
} from "./store"
import type { ClientCard, Color, GameSummary, GameView, PublicPlayer } from "./types"

const colors: readonly Color[] = ["BLUE", "GREEN", "RED", "YELLOW"]

export function App() {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector((root: RootState) => root)

  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(tokenKey) !== null) {
      void dispatch(restoreSession())
    }
  }, [dispatch])

  useEffect(() => {
    if (state.player !== undefined && state.currentGame === undefined && state.games.length === 0) {
      void dispatch(loadGames())
    }
  }, [dispatch, state.player, state.currentGame, state.games.length])

  useEffect(() => {
    const gameId = state.currentGame?.id
    if (gameId === undefined) return
    const subscription = gameUpdates$(gameId).subscribe({
      next: game => dispatch(gameUpdated(game)),
      error: error => dispatch(setClientError(errorMessage(error))),
    })
    return () => subscription.unsubscribe()
  }, [dispatch, state.currentGame?.id])

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">WEB3 · Assignment 5</p>
          <h1>UNO multiplayer</h1>
        </div>
        {state.player !== undefined && (
          <div className="identity">
            <span>{state.player.username} · {state.player.score} pts</span>
            <button onClick={() => dispatch(logout())}>Log out</button>
          </div>
        )}
      </header>

      {state.error !== undefined && <div className="error" role="alert">{state.error}</div>}

      {state.player === undefined
        ? <AuthPanel busy={state.busy} dispatch={dispatch} />
        : state.currentGame === undefined
          ? <LobbyPanel player={state.player} games={state.games} busy={state.busy} dispatch={dispatch} />
          : <GamePanel game={state.currentGame} busy={state.busy} dispatch={dispatch} />}
    </main>
  )
}

function AuthPanel({ busy, dispatch }: { busy: boolean; dispatch: AppDispatch }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const credentials = { username, password }
    void dispatch(mode === "login" ? loginUser(credentials) : registerUser(credentials))
  }

  return (
    <section className="panel auth-panel">
      <h2>{mode === "login" ? "Sign in" : "Create player"}</h2>
      <p>Use a separate browser profile for each human player.</p>
      <form onSubmit={submit} className="stack">
        <label>Username<input value={username} onChange={event => setUsername(event.target.value)} minLength={2} required /></label>
        <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={4} required /></label>
        <button className="primary" disabled={busy}>{mode === "login" ? "Sign in" : "Register"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account?" : "Already registered?"}</button>
    </section>
  )
}

function LobbyPanel({ player, games, busy, dispatch }: {
  player: PublicPlayer
  games: readonly GameSummary[]
  busy: boolean
  dispatch: AppDispatch
}) {
  const [name, setName] = useState("Friday UNO")
  const [maxPlayers, setMaxPlayers] = useState(4)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void dispatch(createGame({ name, maxPlayers }))
  }

  return (
    <section className="grid two-columns">
      <article className="panel">
        <h2>Create a game</h2>
        <form onSubmit={submit} className="stack">
          <label>Name<input value={name} onChange={event => setName(event.target.value)} maxLength={50} required /></label>
          <label>Players<select value={maxPlayers} onChange={event => setMaxPlayers(Number(event.target.value))}>{[2, 3, 4].map(value => <option key={value}>{value}</option>)}</select></label>
          <button className="primary" disabled={busy}>Create</button>
        </form>
      </article>

      <article className="panel">
        <div className="row between">
          <div><h2>Lobby</h2><p>Signed in as {player.username}</p></div>
          <button onClick={() => void dispatch(loadGames())} disabled={busy}>Refresh</button>
        </div>
        <div className="game-list">
          {games.length === 0 && <p>No games yet.</p>}
          {games.map(game => <LobbyGame key={game.id} game={game} busy={busy} dispatch={dispatch} />)}
        </div>
      </article>
    </section>
  )
}

function LobbyGame({ game, busy, dispatch }: { game: GameSummary; busy: boolean; dispatch: AppDispatch }) {
  const full = game.playerCount >= game.maxPlayers
  return (
    <div className="game-row">
      <div>
        <strong>{game.name}</strong>
        <span>{game.hostUsername} · {game.playerCount}/{game.maxPlayers} · {game.status}</span>
      </div>
      {game.joined
        ? <button onClick={() => void dispatch(openGame(game.id))} disabled={busy}>Open</button>
        : <button onClick={() => void dispatch(joinGame(game.id))} disabled={busy || full || game.status !== "WAITING"}>Join</button>}
    </div>
  )
}

function GamePanel({ game, busy, dispatch }: { game: GameView; busy: boolean; dispatch: AppDispatch }) {
  const [wildColor, setWildColor] = useState<Color>("RED")
  const own = game.players.find(player => player.id === game.viewerId)
  const turn = game.players.find(player => player.id === game.playerInTurnId)
  const winner = game.players.find(player => player.id === game.winnerId)
  const isHost = game.hostId === game.viewerId
  const isMyTurn = game.playerInTurnId === game.viewerId
  const hand = own?.cards ?? []

  const title = useMemo(() => {
    if (game.status === "FINISHED") return `${winner?.username ?? "A player"} won`
    if (game.status === "WAITING") return "Waiting room"
    return turn === undefined ? "Round" : `${turn.username}'s turn`
  }, [game.status, turn, winner])

  return (
    <section className="panel game-panel">
      <div className="row between">
        <div><p className="eyebrow">{game.name}</p><h2>{title}</h2></div>
        <button onClick={() => { dispatch(leaveGameView()); void dispatch(loadGames()) }}>Back to lobby</button>
      </div>

      <div className="players">
        {game.players.map(player => (
          <div key={player.id} className={player.id === game.playerInTurnId ? "player active" : "player"}>
            <strong>{player.username}{player.id === game.viewerId ? " (you)" : ""}</strong>
            <span>{player.cardCount} cards</span>
            {player.id !== game.viewerId && game.status === "PLAYING" && (
              <button className="small" disabled={busy} onClick={() => void dispatch(catchUno({ gameId: game.id, accusedPlayerId: player.id }))}>Catch UNO</button>
            )}
          </div>
        ))}
      </div>

      {game.status === "WAITING" && (
        <div className="center-block">
          <p>{game.players.length}/{game.maxPlayers} players joined.</p>
          {isHost ? <button className="primary" disabled={busy || game.players.length < 2} onClick={() => void dispatch(startGame(game.id))}>Start game</button> : <p>Waiting for the host to start.</p>}
        </div>
      )}

      {game.status === "PLAYING" && (
        <>
          <div className="table-state">
            <div><span>Discard</span><strong>{cardLabel(game.discardTop)}</strong></div>
            <div><span>Color</span><strong>{game.currentColor ?? "—"}</strong></div>
            <div><span>Direction</span><strong>{game.currentDirection ?? "—"}</strong></div>
          </div>

          <div className="controls">
            <button className="primary" disabled={busy || !isMyTurn} onClick={() => void dispatch(drawCard(game.id))}>Draw</button>
            <button disabled={busy} onClick={() => void dispatch(sayUno(game.id))}>Say UNO</button>
            <label>Wild color<select value={wildColor} onChange={event => setWildColor(event.target.value as Color)}>{colors.map(color => <option key={color}>{color}</option>)}</select></label>
          </div>

          <h3>Your hand</h3>
          <div className="hand">
            {hand.map((card, index) => {
              const wild = card.type === "WILD" || card.type === "WILD DRAW"
              return <button key={`${card.type}-${card.color ?? "wild"}-${card.number ?? index}-${index}`} className="card" disabled={busy || !isMyTurn} onClick={() => void dispatch(playCard({ gameId: game.id, cardIndex: index, ...(wild ? { color: wildColor } : {}) }))}>{cardLabel(card)}</button>
            })}
          </div>
        </>
      )}

      {game.status === "FINISHED" && <div className="center-block"><p>Round score: <strong>{game.score ?? 0}</strong></p></div>}
    </section>
  )
}

function cardLabel(card: ClientCard | undefined): string {
  if (card === undefined) return "—"
  if (card.type === "NUMBERED") return `${card.color ?? ""} ${card.number ?? ""}`.trim()
  if (card.type === "WILD" || card.type === "WILD DRAW") return card.type
  return `${card.color ?? ""} ${card.type}`.trim()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Live update stream failed"
}
