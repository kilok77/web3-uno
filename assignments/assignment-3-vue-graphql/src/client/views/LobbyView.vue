<script setup lang="ts">
import { ref } from "vue"
import { useSessionStore } from "../stores/session"

const store = useSessionStore()
const name = ref("UNO table")
const maxPlayers = ref(4)

async function create() {
  await store.createGame(name.value, maxPlayers.value)
}
</script>

<template>
  <section class="grid two-column">
    <article class="panel">
      <h2>Create game</h2>
      <form @submit.prevent="create">
        <label>Game name <input v-model="name" required maxlength="50" /></label>
        <label>Maximum players
          <select v-model.number="maxPlayers"><option :value="2">2</option><option :value="3">3</option><option :value="4">4</option></select>
        </label>
        <button :disabled="store.busy">Create</button>
      </form>
    </article>

    <article class="panel">
      <div class="row between"><h2>Available games</h2><button class="secondary" @click="store.loadGames">Refresh</button></div>
      <p v-if="store.games.length === 0">No games yet.</p>
      <div v-for="game in store.games" :key="game.id" class="game-row">
        <div><strong>{{ game.name }}</strong><small>{{ game.hostUsername }} · {{ game.playerCount }}/{{ game.maxPlayers }} · {{ game.status }}</small></div>
        <button v-if="game.joined" @click="store.openGame(game.id)">Open</button>
        <button v-else-if="game.status === 'WAITING' && game.playerCount < game.maxPlayers" @click="store.joinGame(game.id)">Join</button>
      </div>
    </article>
  </section>
</template>
