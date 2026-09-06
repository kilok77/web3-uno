<script setup lang="ts">
import { computed, ref } from "vue"
import { useGameStore } from "../stores/game"
import UnoCard from "../components/UnoCard.vue"
import type { Color } from "../domain/model/deck"

const game = useGameStore()
const wildCardIndex = ref<number | null>(null)
const colorChoices: Color[] = ["BLUE", "GREEN", "RED", "YELLOW"]

const humanHand = computed(() => game.snapshot?.hands[0] ?? [])
const opponents = computed(() => (game.snapshot?.players ?? []).slice(1).map((name, offset) => ({
  name,
  playerIndex: offset + 1,
  cardCount: game.snapshot?.hands[offset + 1]?.length ?? 0,
})))
const playerInTurnName = computed(() => {
  const index = game.snapshot?.playerInTurn
  return index === undefined ? "—" : game.players[index]
})
const canSayUno = computed(() => game.catchablePlayerIndex === 0
  || (game.isHumanTurn && humanHand.value.length === 2))
const canCatchUno = computed(() => game.isHumanTurn
  && game.catchablePlayerIndex !== null
  && game.catchablePlayerIndex !== 0)

function chooseCard(index: number): void {
  const card = humanHand.value[index]
  if (card === undefined || !game.isHumanCardPlayable(index)) return
  if (card.type === "WILD" || card.type === "WILD DRAW") {
    wildCardIndex.value = index
    return
  }
  game.playHumanCard(index)
}

function playWild(color: Color): void {
  if (wildCardIndex.value === null) return
  game.playHumanCard(wildCardIndex.value, color)
  wildCardIndex.value = null
}
</script>

<template>
  <section class="game-layout">
    <header class="game-header panel">
      <div>
        <p class="eyebrow">One-round UNO</p>
        <h1>{{ game.humanName }} vs bots</h1>
      </div>
      <button class="secondary-button" type="button" @click="game.reset">New setup</button>
    </header>

    <section class="opponents" aria-label="Opponents">
      <article
        v-for="opponent in opponents"
        :key="opponent.playerIndex"
        class="opponent panel"
        :class="{ active: game.snapshot?.playerInTurn === opponent.playerIndex }"
      >
        <strong>{{ opponent.name }}</strong>
        <span>{{ opponent.cardCount }} cards</span>
        <span v-if="game.snapshot?.playerInTurn === opponent.playerIndex && game.botThinking">Thinking…</span>
      </article>
    </section>

    <section class="table panel">
      <div class="status-grid">
        <span><b>Turn</b> {{ playerInTurnName }}</span>
        <span><b>Color</b> {{ game.snapshot?.currentColor }}</span>
        <span><b>Direction</b> {{ game.snapshot?.currentDirection }}</span>
        <span><b>Draw pile</b> {{ game.snapshot?.drawPile.length ?? 0 }}</span>
      </div>

      <div class="discard-zone">
        <span class="pile-label">Discard</span>
        <UnoCard v-if="game.discardTop" :card="game.discardTop" disabled />
      </div>

      <p class="game-message" aria-live="polite">{{ game.statusMessage }}</p>

      <div class="action-row">
        <button
          class="primary-button"
          type="button"
          :disabled="!game.isHumanTurn || game.humanMustResolveDraw"
          @click="game.drawHuman"
        >
          Draw card
        </button>
        <button
          class="uno-button"
          type="button"
          :disabled="!canSayUno"
          @click="game.sayUnoHuman"
        >UNO!</button>
        <button
          v-if="canCatchUno"
          class="danger-button"
          type="button"
          @click="game.catchUnoHuman"
        >Catch missed UNO</button>
      </div>
    </section>

    <section class="hand panel" :class="{ active: game.isHumanTurn }">
      <div class="hand-heading">
        <div>
          <p class="eyebrow">Your hand</p>
          <h2>{{ humanHand.length }} cards</h2>
        </div>
        <span v-if="game.humanMustResolveDraw">Only the freshly drawn card can be played.</span>
      </div>
      <div class="cards-row">
        <UnoCard
          v-for="(card, index) in humanHand"
          :key="`${index}-${card.type}-${'color' in card ? card.color : 'wild'}`"
          :card="card"
          :playable="game.isHumanCardPlayable(index)"
          :disabled="!game.isHumanCardPlayable(index)"
          @click="chooseCard(index)"
        />
      </div>
    </section>

    <div v-if="wildCardIndex !== null" class="modal-backdrop" @click.self="wildCardIndex = null">
      <section class="color-picker panel" role="dialog" aria-modal="true" aria-label="Choose Wild color">
        <h2>Choose the next color</h2>
        <div class="color-buttons">
          <button
            v-for="color in colorChoices"
            :key="color"
            class="color-button"
            :class="`card-${color.toLowerCase()}`"
            type="button"
            @click="playWild(color)"
          >{{ color }}</button>
        </div>
      </section>
    </div>
  </section>
</template>
