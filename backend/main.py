import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.modules.auth import router as auth_router
from backend.modules.categories import router as categories_router
from backend.modules.dashboard import router as dashboard_router
from backend.modules.goals import router as goals_router
from backend.modules.profile import router as profile_router
from backend.modules.transactions import router as transactions_router
from backend.modules.utils.router import router as utils_router

app = FastAPI(
    title="FinCoach API",
    version="1.0.0",
    description="API RESTful para autenticao, dashboard e transacoes.",
)

_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
for _url in os.getenv("FRONTEND_URL", "").split(","):
    _url = _url.strip()
    if _url:
        _origins.append(_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(goals_router)
app.include_router(profile_router)
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(utils_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
