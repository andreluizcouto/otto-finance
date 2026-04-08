from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

