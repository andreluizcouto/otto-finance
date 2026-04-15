"""Schemas Pydantic centralizados do FinCoach API."""
import re
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# --- Auth ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


# --- Categories ---

class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color_hex: str = Field(min_length=4, max_length=7)
    emoji: str = Field(default="🏷️", max_length=4)

    @field_validator("color_hex")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", v):
            raise ValueError("color_hex deve ser uma cor hexadecimal valida (#RGB ou #RRGGBB).")
        return v


class RenameCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)


# --- Transactions ---

class CorrectTransactionRequest(BaseModel):
    category_id: UUID  # valida formato UUID automaticamente


class ImportPdfRequest(BaseModel):
    result: str = Field(max_length=500_000)
