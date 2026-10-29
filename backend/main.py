import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.local_db import get_database
from backend.modules.categories import router as categories_router
from backend.modules.dashboard import router as dashboard_router
from backend.modules.goals import router as goals_router
from backend.modules.profile import router as profile_router
from backend.modules.transactions import router as transactions_router
from backend.modules.utils.router import router as utils_router

app = FastAPI(
    title="OTTO API",
    version="2.0.0",
    description="API local do OTTO: dashboard, transacoes, metas e leitura de extratos.",
)

# O app roda só nesta máquina: a API aceita apenas o front-end local.
# Outra porta? FRONTEND_URL=http://127.0.0.1:3000
_raw_origins = os.getenv("FRONTEND_URL", "")
_extra = [u.strip() for u in _raw_origins.split(",") if u.strip()]

_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    *_extra,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(goals_router)
app.include_router(profile_router)
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(utils_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/local", tags=["health"])
def local_info() -> dict:
    """Onde os dados estão guardados e se a leitura de PDF com IA está ligada."""
    return {
        "db_path": get_database().path,
        "ai_enabled": bool(os.getenv("ANTHROPIC_API_KEY", "").strip()),
    }
