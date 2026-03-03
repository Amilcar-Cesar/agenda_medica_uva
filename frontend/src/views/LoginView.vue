<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { setSession } from "../services/auth";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const submit = async () => {
  error.value = "";
  loading.value = true;

  try {
    const response = await api.post("/api/auth/login", {
      email: email.value,
      password: password.value,
    });

    setSession(response.data.token, response.data.user);
    router.push(response.data.user.role === "secretary" ? "/admin" : "/dashboard");
  } catch (err) {
    error.value = "Email ou senha invalidos.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="page">
    <div class="card fade-in">
      <h1>Entrar</h1>
      <p class="muted">Acesse para visualizar ou gerenciar consultas.</p>
      <form class="stack" @submit.prevent="submit">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" required placeholder="nome@email.com" />
        </label>
        <label class="field">
          <span>Senha</span>
          <input v-model="password" type="password" required placeholder="********" />
        </label>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? "Entrando..." : "Entrar" }}
        </button>
        <p v-if="error" class="alert">{{ error }}</p>
      </form>
    </div>
  </section>
</template>
