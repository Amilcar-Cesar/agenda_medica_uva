<script setup>
import { onMounted, ref } from "vue";
import api from "../services/api";

const appointments = ref([]);
const loading = ref(false);
const error = ref("");
const filterStatus = ref("");

const loadAppointments = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get("/api/admin/appointments", {
      params: filterStatus.value ? { status: filterStatus.value } : {},
    });
    appointments.value = response.data;
  } catch (err) {
    error.value = "Erro ao carregar atendimentos.";
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (appointment, status) => {
  await api.put(`/api/admin/appointments/${appointment.id}/status`, { status });
  appointment.status = status;
};

const assignSecretary = async (appointment) => {
  if (!appointment.secretary_id) {
    return;
  }
  await api.put(`/api/admin/appointments/${appointment.id}/assign`, {
    secretaryId: Number(appointment.secretary_id),
  });
};

onMounted(() => {
  loadAppointments();
});
</script>

<template>
  <section class="page">
    <div class="card fade-in">
      <div class="card-header">
        <div>
          <h1>Painel administrativo</h1>
          <p class="muted">Gerencie status e acompanhamento dos atendimentos.</p>
        </div>
        <select v-model="filterStatus" @change="loadAppointments">
          <option value="">Todos</option>
          <option value="agendado">Agendados</option>
          <option value="concluido">Concluidos</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      <p v-if="error" class="alert">{{ error }}</p>
      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="list">
        <article v-for="appointment in appointments" :key="appointment.id" class="list-item">
          <div>
            <h3>{{ appointment.date }} - {{ appointment.time }}</h3>
            <p class="muted">Paciente #{{ appointment.patient_id }} · {{ appointment.city }}</p>
            <p v-if="appointment.weather_rain !== null" class="muted">
              {{ appointment.weather_rain ? "Chuva prevista" : "Sem chuva" }}
            </p>
          </div>
          <div class="stack compact">
            <select
              :value="appointment.status"
              @change="updateStatus(appointment, $event.target.value)"
            >
              <option value="agendado">Agendada</option>
              <option value="concluido">Concluida</option>
              <option value="cancelado">Cancelada</option>
            </select>
            <input
              v-model="appointment.secretary_id"
              type="number"
              min="1"
              placeholder="ID secretario"
              @blur="assignSecretary(appointment)"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
