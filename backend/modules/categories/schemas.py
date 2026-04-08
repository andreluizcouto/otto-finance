from pydantic import BaseModel, Field

class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color_hex: str = Field(min_length=4, max_length=7)
    emoji: str = Field(default="🏷️", max_length=4)

class RenameCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
