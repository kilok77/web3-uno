<script setup lang="ts">
import { computed } from "vue"
import type { Card } from "../domain/model/deck"

const props = withDefaults(defineProps<{
  card: Card
  playable?: boolean
  disabled?: boolean
  compact?: boolean
}>(), {
  playable: false,
  disabled: false,
  compact: false,
})

const emit = defineEmits<{ click: [] }>()

const colorClass = computed(() => "color" in props.card
  ? `card-${props.card.color.toLowerCase()}`
  : "card-wild")

const label = computed(() => {
  switch (props.card.type) {
    case "NUMBERED": return String(props.card.number)
    case "SKIP": return "Skip"
    case "REVERSE": return "Reverse"
    case "DRAW": return "+2"
    case "WILD": return "Wild"
    case "WILD DRAW": return "Wild +4"
  }
})
</script>

<template>
  <button
    class="uno-card"
    :class="[colorClass, { playable, compact }]"
    :disabled="disabled"
    type="button"
    @click="emit('click')"
  >
    <span class="uno-card__label">{{ label }}</span>
  </button>
</template>
