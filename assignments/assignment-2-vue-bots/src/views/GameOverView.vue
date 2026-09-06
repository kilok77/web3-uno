<script setup lang="ts">
import { computed } from "vue"
import { useGameStore } from "../stores/game"

const game = useGameStore()
const winnerName = computed(() => game.winnerIndex === null
  ? "Unknown player"
  : game.players[game.winnerIndex] ?? "Unknown player")
const humanWon = computed(() => game.winnerIndex === 0)
</script>

<template>
  <section class="panel game-over">
    <p class="eyebrow">Round complete</p>
    <h1>{{ humanWon ? 'You won!' : `${winnerName} won` }}</h1>
    <p>{{ winnerName }} played their final card first.</p>
    <button class="primary-button" type="button" @click="game.reset">Play again</button>
  </section>
</template>
