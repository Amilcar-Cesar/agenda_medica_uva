<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { setSession } from "../services/auth";

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("patient");
const error = ref("");
const loading = ref(false);

const submit = async () => {
  error.value = "";
  loading.value = true;

  try {
    await api.post("/api/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });

    const login = await api.post("/api/auth/login", {
      email: email.value,
      password: password.value,
    });

    setSession(login.data.token, login.data.user);
    router.push(login.data.user.role === "secretary" ? "/admin" : "/dashboard");
  } catch (err) {
    error.value = "Nao foi possivel registrar.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="page">
    <div class="card fade-in">
      <h1>Criar conta</h1>
      <p class="muted">Cadastre pacientes e secretarios com seguranca.</p>
      <form class="stack" @submit.prevent="submit">
        <label class="field">
          <span>Nome completo</span>
          <input v-model="name" type="text" required placeholder="Maria Silva" />
        </label>
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" required placeholder="nome@email.com" />
        </label>
        <label class="field">
          <span>Senha</span>
          <input v-model="password" type="password" required placeholder="Minimo 6 caracteres" />
        </label>
        <label class="field">
          <span>Perfil</span>
          <select v-model="role">
            <option value="patient">Paciente</option>
            <option value="secretary">Secretario</option>
          </select>
        </label>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? "Criando..." : "Criar conta" }}
        </button>
        <p v-if="error" class="alert">{{ error }}</p>
      </form>
    </div>
  </section>
</template>
