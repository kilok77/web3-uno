<script setup lang="ts">
import { computed, ref } from "vue"
import type { Card, Color } from "../../domain/model/deck"
import { useSessionStore } from "../stores/session"

const store = useSessionStore()
const selectedColor = ref<Color>("RED")
const game = computed(() => store.game!)
const ownPlayer = computed(() => game.value.players.find(player => player.id === game.value.viewerId))
const ownHand = computed(() => ownPlayer.value?.cards ?? [])
const isMyTurn = computed(() => game.value.playerInTurnId === game.value.viewerId)
const winner = computed(() => game.value.players.find(player => player.id === game.value.winnerId))

function label(card: Card): string {
  if (card.type === "NUMBERED") return `${card.color} ${card.number}`
  if ("color" in card) return `${card.color} ${card.type}`
  return card.type
}

async function play(card: Card, index: number) {
  const color = card.type === "WILD" || card.type === "WILD DRAW" ? selectedColor.value : undefined
  await store.playCard(index, color)
}
</script>

<template>
  <section class="panel game-panel">
    <div class="row between">
      <div><p class="eyebrow">{{ game.status }}</p><h2>{{ game.name }}</h2></div>
      <button class="secondary" @click="store.backToLobby">Back to lobby</button>
    </div>

    <template v-if="game.status === 'WAITING'">
      <h3>Players</h3>
      <ul><li v-for="player in game.players" :key="player.id">{{ player.username }} <strong v-if="player.id === game.hostId">(host)</strong></li></ul>
      <p>Waiting for {{ Math.max(0, 2 - game.players.length) }} more player(s) before the game can start.</p>
      <button v-if="game.viewerId === game.hostId" :disabled="game.players.length < 2 || store.busy" @click="store.startGame">Start game</button>
    </template>

    <template v-else-if="game.status === 'PLAYING'">
      <div class="table-info">
        <div><span>Discard</span><strong>{{ game.discardTop ? label(game.discardTop) : '—' }}</strong></div>
        <div><span>Current color</span><strong>{{ game.currentColor }}</strong></div>
        <div><span>Direction</span><strong>{{ game.currentDirection }}</strong></div>
      </div>

      <div class="opponents">
        <article v-for="player in game.players.filter(player => player.id !== game.viewerId)" :key="player.id" class="opponent">
          <strong>{{ player.username }}</strong><span>{{ player.cardCount }} cards</span>
          <span v-if="game.playerInTurnId === player.id" class="turn">In turn</span>
          <button class="tiny" @click="store.catchUno(player.id)">Catch UNO</button>
        </article>
      </div>

      <div class="row between">
        <h3>Your hand <span v-if="isMyTurn" class="turn">Your turn</span></h3>
        <div class="row">
          <select v-model="selectedColor" aria-label="Wild color"><option>RED</option><option>GREEN</option><option>BLUE</option><option>YELLOW</option></select>
          <button class="secondary" :disabled="!isMyTurn || store.busy" @click="store.drawCard">Draw</button>
          <button class="secondary" :disabled="store.busy" @click="store.sayUno">UNO!</button>
        </div>
      </div>
      <div class="hand">
        <button v-for="(card, index) in ownHand" :key="`${label(card)}-${index}`" class="card" :disabled="!isMyTurn || store.busy" @click="play(card, index)">
          {{ label(card) }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="finish"><p class="eyebrow">Round complete</p><h2>{{ winner?.username ?? 'Unknown player' }} wins</h2><p>Round score: {{ game.score ?? 0 }}</p></div>
    </template>
  </section>
</template>
