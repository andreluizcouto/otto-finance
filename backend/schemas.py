"""Schemas Pydantic centralizados do FinCoach API."""
from pydantic import BaseModel, EmailStr, Field


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


class RenameCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)


# --- Transactions ---

class CorrectTransactionRequest(BaseModel):
    category_id: str
