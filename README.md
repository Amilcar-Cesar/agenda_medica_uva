# AVA2 Clinica - Agendamento de Consultas

Aplicacao web para cadastro, login, agendamento de consultas e painel administrativo. Integra ViaCEP para endereco e API de clima para alerta de chuva.

## Tecnologias

- Frontend: Vue 3 + Vite
- Backend: Node.js + Express
- Banco: SQLite

## Configuracao

### Backend

1. Crie um arquivo `.env` em `backend/` baseado em `backend/.env.example`.
2. Defina `JWT_SECRET` e a chave da API de clima (`OPENWEATHER_API_KEY` ou `WEATHERAPI_KEY`).
3. Opcional: ajuste `WEATHER_PROVIDER` para `openweather` ou `weatherapi`.

### Frontend

1. Crie um arquivo `.env` em `frontend/` baseado em `frontend/.env.example`.
2. Ajuste `VITE_API_URL` conforme a URL do backend.

## Executar localmente

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Fluxo principal

- Pacientes e secretarios fazem cadastro e login.
- Pacientes criam consultas com verificador de horario.
- Sistema consulta endereco via CEP e chama API de clima para alertar chuva.
- Secretarios acessam painel administrativo para gerenciar atendimentos.

## Deploy (Render)

- Backend: configure variaveis de ambiente do `.env` no servico web.
- Frontend: defina `VITE_API_URL` para apontar ao backend publicado.
- SQLite: use disco persistente se precisar manter dados entre deploys.
