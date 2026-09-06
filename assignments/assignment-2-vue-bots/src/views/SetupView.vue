<script setup lang="ts">
import { ref } from "vue"
import { useGameStore } from "../stores/game"

const game = useGameStore()
const name = ref("Player")
const botCount = ref(1)

function start(): void {
  game.startRound(name.value, botCount.value)
}
</script>

<template>
  <section class="panel setup-panel">
    <p class="eyebrow">WEB3 · Assignment 2</p>
    <h1>UNO against bots</h1>
    <p class="lede">Play one browser-only round against one to three Web Worker opponents.</p>

    <form class="setup-form" @submit.prevent="start">
      <label>
        Your name
        <input v-model="name" maxlength="30" autocomplete="name" />
      </label>

      <label>
        Opponents
        <select v-model.number="botCount">
          <option :value="1">1 bot</option>
          <option :value="2">2 bots</option>
          <option :value="3">3 bots</option>
        </select>
      </label>

      <button class="primary-button" type="submit">Start round</button>
    </form>
  </section>
</template>
