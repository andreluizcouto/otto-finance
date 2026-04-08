from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import auth, categories, dashboard, transactions

app = FastAPI(
    title="FinCoach API",
    version="1.0.0",
    description="API RESTful para autenticao, dashboard e transacoes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(categories.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
