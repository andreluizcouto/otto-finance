import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from backend.core import get_current_client, get_current_user
from .services import get_dashboard_payload

router = APIRouter(prefix="/api", tags=["dashboard"])
logger = logging.getLogger(__name__)

@router.get("/dashboard")
def dashboard(
    period: str = Query(default="Este mes"),
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    allowed_periods = {"Esta semana", "Este mes", "Ultimos 3 meses"}
    if period not in allowed_periods:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Periodo invalido. Use um de: {', '.join(sorted(allowed_periods))}.",
        )

    try:
        return get_dashboard_payload(client, user["id"], period)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Erro inesperado ao montar dashboard (period=%s, user_id=%s)", period, user.get("id"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar dados do dashboard.",
        )
