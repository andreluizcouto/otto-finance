from pydantic import BaseModel

class CorrectTransactionRequest(BaseModel):
    category_id: str
