# Quick Task 260407-qtt

## Description
Migrar backend Streamlit para FastAPI e conectar frontend React/Tailwind na nova API.

## Tasks

1. Criar backend FastAPI separado da UI Streamlit
- files: `backend/main.py`, `backend/api/**`, `backend/services/**`, `backend/core/config.py`, `backend/schemas/**`, `main.py`, `requirements.txt`
- action: mover autenticacao, dashboard (Supabase + Pandas) e transacoes/categorias para endpoints REST JSON com CORS para `localhost:5173`
- verify: `py -3 -m compileall backend main.py`
- done: backend compila sem erro

2. Conectar frontend React na API
- files: `src/main.tsx`, `src/app/App.tsx`, `src/app/api/client.ts`, `src/app/context/AuthContext.tsx`, `src/app/components/Header.tsx`, `src/app/components/KPICards.tsx`, `src/app/components/TrendChart.tsx`, `src/app/components/CategoryChart.tsx`, `src/app/components/RecentTransactions.tsx`, `src/app/components/Sidebar.tsx`
- action: substituir dados mockados por chamadas HTTP para `http://localhost:8000`, adicionar contexto de autenticacao com persistencia de JWT e manter visual existente
- verify: busca de mocks antigos nao retorna resultados
- done: componentes principais consumindo payload real da API

