from dotenv import load_dotenv

from backend.local_db import LocalClient, get_database

load_dotenv()

# O OTTO roda só na máquina de quem usa: não há login, há um único usuário local.
LOCAL_USER = {
    "id": "00000000-0000-4000-8000-000000000001",
    "email": "",
    "created_at": "",
}


def get_current_user() -> dict:
    return LOCAL_USER


def get_current_client() -> LocalClient:
    return LocalClient(get_database())


def format_brl(value: float) -> str:
    """Formata um valor float para o padrão de moeda brasileiro (R$)."""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
