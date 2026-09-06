<script setup lang="ts">
import { ref } from "vue"
import { useSessionStore } from "../stores/session"

const store = useSessionStore()
const username = ref("")
const password = ref("")
const mode = ref<"login" | "register">("login")

async function submit() {
  if (mode.value === "login") await store.login(username.value, password.value)
  else await store.register(username.value, password.value)
}
</script>

<template>
  <section class="panel narrow">
    <h2>{{ mode === "login" ? "Log in" : "Create account" }}</h2>
    <p>Each browser signs in as one player. Open another browser/private window to simulate another human.</p>
    <form @submit.prevent="submit">
      <label>Username <input v-model="username" autocomplete="username" required /></label>
      <label>Password <input v-model="password" type="password" autocomplete="current-password" required minlength="4" /></label>
      <button :disabled="store.busy">{{ mode === "login" ? "Log in" : "Register" }}</button>
    </form>
    <button class="link" @click="mode = mode === 'login' ? 'register' : 'login'">
      {{ mode === "login" ? "Need an account? Register" : "Already registered? Log in" }}
    </button>
  </section>
</template>
