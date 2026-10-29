# OTTO — assistente financeiro com IA

Controle de gastos que não depende de planilha: você sobe o extrato do banco em PDF, a IA lê as transações, classifica cada gasto por categoria e o painel mostra para onde o dinheiro foi e como estão as suas metas.

**No ar:** https://otto-eosin.vercel.app

## O que faz

- **Importa extrato em PDF**, inclusive PDF com senha: o texto é extraído no servidor e o Claude (Anthropic) transforma em transações estruturadas.
- **Classifica gastos automaticamente**, com um classificador local de reserva quando a IA não está disponível.
- **Painel**: fluxo líquido, maiores categorias, orçamento por categoria e alertas.
- **Metas** com acompanhamento de progresso e status.
- Categorias personalizadas, perfil, onboarding e autenticação.

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript, Vite, Tailwind, Radix UI, Recharts, Motion |
| API | Python, FastAPI, Pydantic |
| Dados e login | Supabase (Postgres + Auth) |
| IA | Anthropic Claude (leitura de PDF e classificação) |
| Testes | Pytest |
| Deploy | Vercel |

## Estrutura

```
backend/            API FastAPI, um módulo por domínio
  modules/          auth, categories, dashboard, goals, profile, transactions, utils (PDF)
src/                front-end React
  features/         auth, dashboard, goals, onboarding, settings, transactions
supabase/           schema e categorias iniciais
tests/              testes da API, do classificador e da leitura de PDF
```

## Rodar localmente

Variáveis de ambiente (`.env`):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
FRONTEND_URL=http://127.0.0.1:5173
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

```bash
pip install -r requirements.txt
npm install
python -m uvicorn backend.main:app --port 8000   # API
npm run dev                                       # front-end
python -m pytest                                  # testes
```

No Windows, `dev-up.ps1` sobe os dois de uma vez.

---

<sub>Versão pública do repositório: o histórico foi preservado, mas dados reais de extrato, logs locais e arquivos de configuração da máquina de desenvolvimento foram removidos.</sub>
