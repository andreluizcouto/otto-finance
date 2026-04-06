"""Simulated transaction generator with realistic Brazilian financial data.

Generates 3 months of transactions with weighted category distribution,
real Brazilian merchant names, and coherent amount ranges per category.
"""

import random
from datetime import date, timedelta


MERCHANTS = {
    "alimentacao": ["Carrefour", "Pao de Acucar", "Extra", "Assai", "BIG"],
    "transporte": ["Uber", "99", "Shell", "Ipiranga", "Sem Parar"],
    "moradia": ["Aluguel", "Enel", "Sabesp", "Comgas", "Condominio"],
    "saude": ["Drogasil", "Drogaria SP", "Unimed", "Consulta Medica"],
    "lazer": ["Cinema", "Ingresso.com", "Bar", "Restaurante", "Parque"],
    "educacao": ["Udemy", "Coursera", "Livraria Cultura", "Estacio"],
    "compras": ["Riachuelo", "Renner", "C&A", "Americanas", "Magazine Luiza"],
    "assinaturas": ["Netflix", "Spotify", "Amazon Prime", "Globoplay", "YouTube Premium"],
    "delivery": ["iFood", "Rappi", "Ze Delivery", "Uber Eats"],
    "outros": ["Mercado Livre", "Correios", "Loteria", "Cartorio"],
}

AMOUNT_RANGES = {
    "alimentacao": (15.00, 350.00),
    "transporte": (5.00, 150.00),
    "moradia": (800.00, 2500.00),
    "saude": (30.00, 500.00),
    "lazer": (20.00, 300.00),
    "educacao": (50.00, 800.00),
    "compras": (25.00, 600.00),
    "assinaturas": (15.00, 60.00),
    "delivery": (25.00, 60.00),
    "outros": (10.00, 200.00),
}

CATEGORY_WEIGHTS = {
    "alimentacao": 0.20,
    "delivery": 0.15,
    "transporte": 0.15,
    "moradia": 0.10,
    "compras": 0.10,
    "lazer": 0.10,
    "assinaturas": 0.08,
    "saude": 0.05,
    "educacao": 0.04,
    "outros": 0.03,
}


def generate_transactions(
    user_id: str,
    category_map: dict,
    months: int = 3,
    per_month_range: tuple = (40, 60),
) -> list[dict]:
    """Generate simulated Brazilian financial transactions.

    Args:
        user_id: The authenticated user's UUID.
        category_map: Dict mapping category slugs to category dicts with 'id' key.
        months: Number of months of data to generate (default 3).
        per_month_range: Tuple of (min, max) transactions per month.

    Returns:
        List of transaction dicts ready for Supabase insert.
    """
    transactions = []
    today = date.today()

    for month_offset in range(months):
        # Calculate month boundaries going backwards from current month
        target_month = today.month - month_offset
        target_year = today.year

        while target_month <= 0:
            target_month += 12
            target_year -= 1

        month_start = date(target_year, target_month, 1)

        # Calculate last day of month
        if target_month == 12:
            month_end = date(target_year, 12, 31)
        else:
            month_end = date(target_year, target_month + 1, 1) - timedelta(days=1)

        # Don't generate future transactions
        if month_offset == 0:
            month_end = min(month_end, today)

        n_transactions = random.randint(*per_month_range)

        slugs = list(CATEGORY_WEIGHTS.keys())
        weights = list(CATEGORY_WEIGHTS.values())
        chosen_categories = random.choices(slugs, weights=weights, k=n_transactions)

        for slug in chosen_categories:
            cat = category_map[slug]
            merchant = random.choice(MERCHANTS[slug])
            min_amt, max_amt = AMOUNT_RANGES[slug]
            amount = round(random.uniform(min_amt, max_amt), 2)

            # Generate weighted day using triangular distribution
            # 50/50 chance of start-biased (salary) or end-biased (bills)
            if random.random() < 0.5:
                mode = 5  # start-biased
            else:
                mode = month_end.day - 3  # end-biased

            day = int(random.triangular(1, month_end.day, mode))
            day = max(1, min(day, month_end.day))
            txn_date = month_start.replace(day=day)

            transactions.append({
                "user_id": user_id,
                "amount": amount,
                "date": txn_date.isoformat(),
                "description": merchant,
                "merchant_name": merchant,
                "category_id": cat["id"],
                "confidence_score": "high",
                "payment_method": random.choice(["credito", "debito", "pix"]),
                "is_recurring": slug in ("assinaturas", "moradia"),
            })

    return transactions
