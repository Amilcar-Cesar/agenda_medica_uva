<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clearSession, getUser } from "./services/auth";

const route = useRoute();
const router = useRouter();
const currentUser = ref(getUser());

watch(
  () => route.fullPath,
  () => {
    currentUser.value = getUser();
  }
);

const isLoggedIn = computed(() => Boolean(currentUser.value));

const logout = () => {
  clearSession();
  currentUser.value = null;
  router.push("/login");
};
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">AVA</span>
        <div>
          <h1>Clinica AVA2</h1>
          <p class="muted">Agendamentos inteligentes com previsao de clima.</p>
        </div>
      </div>
      <nav class="nav">
        <RouterLink to="/dashboard">Agenda</RouterLink>
        <RouterLink v-if="currentUser?.role === 'secretary'" to="/admin">
          Administrativo
        </RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/login">Entrar</RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/register">Cadastrar</RouterLink>
        <button v-if="isLoggedIn" class="ghost" @click="logout">Sair</button>
      </nav>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>
