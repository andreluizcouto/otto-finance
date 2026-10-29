from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from backend.local_db import LocalClient as Client

from backend.core import get_current_client, get_current_user
from backend.schemas import GoalCreateRequest, GoalProgressPatchRequest, GoalStatusPatchRequest
from .services import create_goal, list_goals, update_goal_progress, update_goal_status

router = APIRouter(prefix="/api", tags=["goals"])


@router.get("/goals")
def get_goals(
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        return {"goals": list_goals(client, user["id"])}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar metas: {str(exc)}",
        ) from exc


@router.post("/goals")
def post_goal(
    payload: GoalCreateRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        return create_goal(client, user["id"], payload.model_dump())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Prazo invalido.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar meta.",
        ) from exc


@router.patch("/goals/{goal_id}")
def patch_goal(
    goal_id: str,
    payload: GoalProgressPatchRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        result = update_goal_progress(
            client=client,
            user_id=user["id"],
            goal_id=goal_id,
            action=payload.action,
            amount=payload.amount,
        )
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("error", "Falha ao atualizar meta."),
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar meta: {str(exc)}",
        ) from exc


@router.patch("/goals/{goal_id}/status")
def patch_goal_status(
    goal_id: str,
    payload: GoalStatusPatchRequest,
    user: Annotated[dict, Depends(get_current_user)] = None,
    client: Annotated[Client, Depends(get_current_client)] = None,
) -> dict:
    try:
        result = update_goal_status(
            client=client,
            user_id=user["id"],
            goal_id=goal_id,
            status=payload.status,
        )
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("error", "Falha ao atualizar meta."),
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar status da meta.",
        ) from exc
