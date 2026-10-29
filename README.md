# OTTO — assistente financeiro com IA

Controle de gastos que não depende de planilha: você sobe o extrato do banco em PDF, a IA lê as transações, classifica cada gasto por categoria e o painel mostra para onde o dinheiro foi e como estão as suas metas.

**Roda 100% no seu computador.** Não tem conta, login nem servidor: os dados ficam num arquivo SQLite na sua máquina (`data/otto.db`). A única coisa que sai dela é o texto do extrato, enviado à API da Anthropic na hora de ler um PDF, e só se você configurar a sua chave.

## O que faz

- **Importa extrato em PDF**, inclusive PDF com senha: o texto é extraído localmente e o Claude (Anthropic) transforma em transações estruturadas.
- **Classifica gastos automaticamente**, com um classificador local de reserva que funciona sem IA.
- **Painel**: fluxo líquido, maiores categorias, orçamento por categoria e alertas.
- **Metas** com acompanhamento de progresso e status.
- Categorias personalizadas e perfil.

## Rodar

Precisa de **Python 3.11+** e **Node 20+**.

```bash
git clone https://github.com/andreluizcouto/otto-finance.git
cd otto-finance

pip install -r requirements.txt
npm install

cp .env.example .env        # opcional: coloque sua ANTHROPIC_API_KEY para ler PDFs
```

Depois, em dois terminais:

```bash
python -m uvicorn backend.main:app --port 8000   # API
npm run dev                                       # interface → http://127.0.0.1:5173
```

No Windows, `dev-up.ps1` sobe os dois de uma vez.

Sem a chave da Anthropic, tudo funciona menos a leitura de PDF. A chave sai em https://console.anthropic.com.

## Seus dados

- Ficam em `data/otto.db` (ou no caminho de `OTTO_DB_PATH`). O banco e as categorias padrão são criados sozinhos na primeira vez que a API sobe.
- **Backup:** copie esse arquivo.
- **Começar do zero:** desligue a API e apague o arquivo.
- A pasta `data/` está no `.gitignore`, então os seus dados não vão para o Git por engano.

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript, Vite, Tailwind, Radix UI, Recharts, Motion |
| API | Python, FastAPI, Pydantic |
| Dados | SQLite local |
| IA | Anthropic Claude (leitura de PDF) |
| Testes | Pytest |

## Estrutura

```
backend/            API FastAPI, um módulo por domínio
  local_db.py       banco SQLite local (schema, categorias padrão e consultas)
  modules/          categories, dashboard, goals, profile, transactions, utils (PDF)
src/                front-end React
  features/         welcome, onboarding, dashboard, transactions, goals, settings
tests/              testes da API, do banco local, do classificador e da leitura de PDF
```

```bash
python -m pytest    # testes
```

---

<sub>Versão pública do repositório: o histórico foi preservado, mas dados reais de extrato, logs locais e arquivos de configuração da máquina de desenvolvimento foram removidos. A versão online (Supabase + login) foi trocada por esta, que roda só na máquina de quem usa.</sub>
