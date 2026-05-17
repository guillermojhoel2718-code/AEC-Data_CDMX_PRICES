"""
stripe_setup.py
===============
APUCMX — Configuración inicial de productos y precios en Stripe.

Crea:
  1. Producto "Paquete de Tokens APUCMX" + precio 200 MXN (one-time)
  2. Producto "Suscripción Vendedor APUCMX" + precio 100 MXN/mes (recurring)

Guarda los IDs generados en: 1-Backend/config/stripe_ids.json

Uso:
    python 1-Backend/scripts/stripe_setup.py

Requiere:
    pip install stripe python-dotenv
"""

import os
import json
import logging
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv

REPO_ROOT  = Path(__file__).resolve().parents[2]
# Prioridad: .env del backend (consolidado) > .env.local del proyecto
ENV_FILE   = REPO_ROOT / "1-Backend" / ".env"
if not ENV_FILE.exists():
    ENV_FILE = REPO_ROOT / "5-Variables" / ".env.local"

CONFIG_DIR = REPO_ROOT / "1-Backend" / "config"
IDS_FILE   = CONFIG_DIR / "stripe_ids.json"

CONFIG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("stripe_setup")

load_dotenv(ENV_FILE)

STRIPE_SK = os.getenv("STRIPE_SECRET_KEY")
if not STRIPE_SK:
    log.error("Falta STRIPE_SECRET_KEY en .env.local")
    sys.exit(1)

import stripe
stripe.api_key = STRIPE_SK


def crear_producto_tokens() -> dict:
    """Crea o reutiliza el producto de tokens."""
    log.info("Buscando producto de tokens existente...")

    productos = stripe.Product.list(limit=100, active=True)
    for p in productos.data:
        meta = dict(p.get("metadata") or {})
        if meta.get("apucmx_type") == "token_package":
            log.info(f"  Producto existente: {p.id} — {p.name}")
            precios = stripe.Price.list(product=p.id, active=True, limit=5)
            precio = precios.data[0] if precios.data else None
            if precio:
                log.info(f"  Precio existente: {precio.id}")
                return {"product_id": p.id, "price_id": precio.id}

    log.info("  Creando producto de tokens...")
    producto = stripe.Product.create(
        name="Paquete de Tokens APUCMX",
        description="100 tokens para ejecutar auditorías, generación de matrices APU y consultas asistidas por IA. Válidos para la plataforma APUCMX.",
        metadata={"apucmx_type": "token_package", "tokens": "100"},
        images=[],
    )
    log.info(f"  Producto creado: {producto.id}")

    precio = stripe.Price.create(
        product=producto.id,
        unit_amount=20000,       # 200.00 MXN en centavos
        currency="mxn",
        nickname="100 tokens — 200 MXN",
        metadata={"tokens": "100", "apucmx_type": "token_package"},
    )
    log.info(f"  Precio creado: {precio.id} — 200.00 MXN")

    return {"product_id": producto.id, "price_id": precio.id}


def crear_producto_vendedor() -> dict:
    """Crea o reutiliza el producto de suscripción para vendedores."""
    log.info("Buscando producto de vendedor existente...")

    productos = stripe.Product.list(limit=100, active=True)
    for p in productos.data:
        meta = dict(p.get("metadata") or {})
        if meta.get("apucmx_type") == "vendor_subscription":
            log.info(f"  Producto existente: {p.id} — {p.name}")
            precios = stripe.Price.list(product=p.id, active=True, limit=5)
            precio = precios.data[0] if precios.data else None
            if precio:
                return {"product_id": p.id, "price_id": precio.id}

    log.info("  Creando producto de suscripción vendedor...")
    producto = stripe.Product.create(
        name="Suscripción Vendedor APUCMX",
        description="Perfil público como proveedor o contratista en el directorio APUCMX. Incluye catálogo de servicios y visibilidad en búsquedas.",
        metadata={"apucmx_type": "vendor_subscription"},
    )
    log.info(f"  Producto creado: {producto.id}")

    precio = stripe.Price.create(
        product=producto.id,
        unit_amount=10000,       # 100.00 MXN en centavos
        currency="mxn",
        recurring={"interval": "month"},
        nickname="Vendedor mensual — 100 MXN/mes",
        metadata={"apucmx_type": "vendor_subscription"},
    )
    log.info(f"  Precio creado: {precio.id} — 100.00 MXN/mes")

    return {"product_id": producto.id, "price_id": precio.id}


def crear_payment_link(price_id: str) -> str:
    """Crea un payment link de Stripe para compra de tokens."""
    log.info("Creando payment link para tokens...")
    link = stripe.PaymentLink.create(
        line_items=[{"price": price_id, "quantity": 1}],
        metadata={"apucmx_type": "token_purchase"},
        after_completion={"type": "redirect", "redirect": {"url": "https://apucmx.com/tokens?success=true"}},
    )
    log.info(f"  Payment link: {link.url}")
    return link.url


def main():
    log.info("=" * 55)
    log.info("  APUCMX — Stripe Setup")
    log.info(f"  Modo: {'SANDBOX/TEST' if 'test' in STRIPE_SK else 'PRODUCCIÓN ⚠️'}")
    log.info("=" * 55)

    ids = {}

    # 1) Tokens
    tokens = crear_producto_tokens()
    ids["tokens"] = tokens
    ids["tokens"]["payment_link"] = crear_payment_link(tokens["price_id"])

    # 2) Vendedor
    ids["vendor"] = crear_producto_vendedor()

    # 3) Guardar IDs
    ids["_meta"] = {
        "created_at": datetime.now().isoformat(),
        "stripe_mode": "test" if "test" in STRIPE_SK else "live",
        "nota": "Estos IDs se usan en stripe_checkout.py y el webhook"
    }

    IDS_FILE.write_text(json.dumps(ids, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info(f"\n  IDs guardados en: {IDS_FILE}")
    log.info("=" * 55)
    log.info("  Próximo paso: ejecutar stripe_checkout.py para configurar el webhook")
    log.info("=" * 55)


if __name__ == "__main__":
    main()
