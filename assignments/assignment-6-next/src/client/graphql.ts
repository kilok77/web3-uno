import { gql } from "@apollo/client/core"

export const GAME_FIELDS = gql`
  fragment GameFields on GameView {
    id name status hostId maxPlayers viewerId currentColor currentDirection playerInTurnId winnerId score
    discardTop { type color number }
    players { id username cardCount cards { type color number } }
  }
`

export const REGISTER = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) { token player { id username score } }
  }
`
export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) { token player { id username score } }
  }
`
export const ME = gql`query Me { me { id username score } }`
export const GAMES = gql`
  query Games { games { id name status hostId hostUsername maxPlayers playerCount joined } }
`
export const GET_GAME = gql`query Game($id: ID!) { game(id: $id) { ...GameFields } } ${GAME_FIELDS}`
export const CREATE_GAME = gql`mutation CreateGame($name: String!, $maxPlayers: Int!) { createGame(name: $name, maxPlayers: $maxPlayers) { ...GameFields } } ${GAME_FIELDS}`
export const JOIN_GAME = gql`mutation JoinGame($gameId: ID!) { joinGame(gameId: $gameId) { ...GameFields } } ${GAME_FIELDS}`
export const START_GAME = gql`mutation StartGame($gameId: ID!) { startGame(gameId: $gameId) { ...GameFields } } ${GAME_FIELDS}`
export const PLAY_CARD = gql`mutation PlayCard($gameId: ID!, $cardIndex: Int!, $color: Color) { playCard(gameId: $gameId, cardIndex: $cardIndex, color: $color) { ...GameFields } } ${GAME_FIELDS}`
export const DRAW_CARD = gql`mutation DrawCard($gameId: ID!) { drawCard(gameId: $gameId) { ...GameFields } } ${GAME_FIELDS}`
export const SAY_UNO = gql`mutation SayUno($gameId: ID!) { sayUno(gameId: $gameId) { ...GameFields } } ${GAME_FIELDS}`
export const CATCH_UNO = gql`mutation CatchUno($gameId: ID!, $accusedPlayerId: ID!) { catchUno(gameId: $gameId, accusedPlayerId: $accusedPlayerId) { ...GameFields } } ${GAME_FIELDS}`
export const GAME_UPDATED = gql`subscription GameUpdated($gameId: ID!) { gameUpdated(gameId: $gameId) { ...GameFields } } ${GAME_FIELDS}`
