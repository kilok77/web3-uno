<script setup lang="ts">
import { onMounted } from "vue"
import { useSessionStore } from "./stores/session"
import AuthView from "./views/AuthView.vue"
import GameView from "./views/GameView.vue"
import LobbyView from "./views/LobbyView.vue"

const store = useSessionStore()
onMounted(() => { void store.restore() })
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">WEB3 · Assignment 3</p>
        <h1>UNO Multiplayer</h1>
      </div>
      <div v-if="store.player" class="identity">
        <span>{{ store.player.username }} · {{ store.player.score }} pts</span>
        <button class="secondary" @click="store.logout">Log out</button>
      </div>
    </header>

    <p v-if="store.error" class="error">{{ store.error }}</p>
    <AuthView v-if="!store.authenticated" />
    <GameView v-else-if="store.game" />
    <LobbyView v-else />
  </main>
</template>
