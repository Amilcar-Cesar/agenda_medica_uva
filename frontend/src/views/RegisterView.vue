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
  
  // Validações no cliente
  if (!name.value || name.value.length < 2) {
    error.value = "Nome deve ter pelo menos 2 caracteres";
    loading.value = false;
    return;
  }
  
  if (!email.value || !email.value.includes("@")) {
    error.value = "Email inválido";
    loading.value = false;
    return;
  }
  
  if (!password.value || password.value.length < 6) {
    error.value = "Senha deve ter pelo menos 6 caracteres";
    loading.value = false;
    return;
  }
  
  loading.value = true;

  try {
    await api.post("/api/auth/register", {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      role: role.value,
    });

    const login = await api.post("/api/auth/login", {
      email: email.value.trim(),
      password: password.value,
    });

    setSession(login.data.token, login.data.user);
    router.push(login.data.user.role === "secretary" ? "/admin" : "/dashboard");
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err.message) {
      error.value = err.message;
    } else {
      error.value = "Nao foi possivel registrar.";
    }
    console.error("Register error:", err);
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
