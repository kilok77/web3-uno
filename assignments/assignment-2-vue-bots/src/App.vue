<script setup lang="ts">
import { useGameStore } from "./stores/game"
import SetupView from "./views/SetupView.vue"
import GameView from "./views/GameView.vue"
import GameOverView from "./views/GameOverView.vue"

const game = useGameStore()
</script>

<template>
  <main class="app-shell">
    <SetupView v-if="game.screen === 'setup'" />
    <GameView v-else-if="game.screen === 'game'" />
    <GameOverView v-else />
  </main>
</template>
