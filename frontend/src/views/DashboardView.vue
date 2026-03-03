<script setup>
import { onMounted, ref } from "vue";
import api from "../services/api";
import { getUser } from "../services/auth";

const user = getUser();
const appointments = ref([]);
const loading = ref(false);
const error = ref("");
const success = ref("");

const form = ref({
  date: "",
  time: "",
  reason: "",
  cep: "",
  number: "",
  complement: "",
  patientId: "",
});

const loadAppointments = async () => {
  loading.value = true;
  try {
    const response = await api.get("/api/appointments");
    appointments.value = response.data;
  } catch (err) {
    error.value = "Erro ao carregar consultas.";
  } finally {
    loading.value = false;
  }
};

const createAppointment = async () => {
  error.value = "";
  success.value = "";

  try {
    const payload = {
      date: form.value.date,
      time: form.value.time,
      reason: form.value.reason,
      cep: form.value.cep,
      number: form.value.number || undefined,
      complement: form.value.complement || undefined,
    };

    if (user?.role === "secretary") {
      if (!form.value.patientId) {
        error.value = "Informe o ID do paciente.";
        return;
      }
      payload.patientId = Number(form.value.patientId);
    }

    await api.post("/api/appointments", payload);
    success.value = "Consulta agendada com sucesso.";
    form.value.reason = "";
    form.value.cep = "";
    form.value.number = "";
    form.value.complement = "";
    form.value.patientId = "";
    await loadAppointments();
  } catch (err) {
    error.value = "Nao foi possivel agendar.";
  }
};

onMounted(() => {
  loadAppointments();
});
</script>

<template>
  <section class="page">
    <div class="grid">
      <div class="card fade-in">
        <h1>Nova consulta</h1>
        <p class="muted">Preencha os dados e confirmamos o horario disponivel.</p>
        <form class="stack" @submit.prevent="createAppointment">
          <div class="row">
            <label class="field">
              <span>Data</span>
              <input v-model="form.date" type="date" required />
            </label>
            <label class="field">
              <span>Horario</span>
              <input v-model="form.time" type="time" required />
            </label>
          </div>
          <label v-if="user?.role === 'secretary'" class="field">
            <span>ID do paciente</span>
            <input
              v-model="form.patientId"
              type="number"
              min="1"
              required
              placeholder="ID do paciente"
            />
          </label>
          <label class="field">
            <span>CEP</span>
            <input v-model="form.cep" type="text" maxlength="8" required placeholder="Somente numeros" />
          </label>
          <div class="row">
            <label class="field">
              <span>Numero</span>
              <input v-model="form.number" type="text" placeholder="Opcional" />
            </label>
            <label class="field">
              <span>Complemento</span>
              <input v-model="form.complement" type="text" placeholder="Opcional" />
            </label>
          </div>
          <label class="field">
            <span>Motivo</span>
            <textarea v-model="form.reason" rows="3" placeholder="Descreva brevemente"></textarea>
          </label>
          <button class="primary" type="submit">Agendar consulta</button>
          <p v-if="success" class="success">{{ success }}</p>
          <p v-if="error" class="alert">{{ error }}</p>
        </form>
      </div>

      <div class="card fade-in">
        <div class="card-header">
          <h2>Consultas</h2>
          <span class="pill">{{ appointments.length }} registros</span>
        </div>
        <div v-if="loading" class="muted">Carregando...</div>
        <div v-else class="list">
          <article v-for="appointment in appointments" :key="appointment.id" class="list-item">
            <div>
              <h3>{{ appointment.date }} - {{ appointment.time }}</h3>
              <p class="muted">
                {{ appointment.city }} / {{ appointment.state }}
                <span v-if="appointment.weather_rain !== null">
                  · {{ appointment.weather_rain ? "Chuva prevista" : "Sem chuva" }}
                </span>
              </p>
              <p v-if="appointment.weather_summary" class="muted">
                {{ appointment.weather_summary }}
              </p>
            </div>
            <span class="status">{{ appointment.status }}</span>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
