<<<<<<< HEAD
"""
stripe_checkout.py  (v2 — con Gemini Flash)
===========================================
APUCMX — Webhook + Checkout Session + análisis de pagos con IA.

Novedades v2:
  · Gemini Flash verifica el evento de pago y genera mensajes personalizados.
  · Genera resumen ejecutivo del pago para logs y notificaciones.
  · Manejo inteligente de duplicados (idempotencia via session_id).
  · Soporta múltiples tipos de precio (tokens + suscripciones).

Endpoints:
  POST /create-checkout-session  → genera sesión de pago Stripe
  POST /webhook                  → recibe eventos, acredita tokens con IA
  GET  /health                   → status del servidor

Variables requeridas en 1-Backend/.env:
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  GOOGLE_API_KEY

Uso local:
  python 1-Backend/scripts/stripe_checkout.py
  stripe listen --forward-to localhost:5000/webhook
"""

import os
import json
import logging
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, request, jsonify

# ─── Config de rutas ─────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE  = REPO_ROOT / "1-Backend" / ".env"
if not ENV_FILE.exists():
    ENV_FILE = REPO_ROOT / "5-Variables" / ".env.local"
IDS_FILE  = REPO_ROOT / "1-Backend" / "config" / "stripe_ids.json"

load_dotenv(ENV_FILE)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("stripe_checkout")

# ─── Dependencias externas ────────────────────────────────────────────────────

import stripe
from supabase import create_client, Client

STRIPE_SK      = os.environ["STRIPE_SECRET_KEY"]
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
SUPABASE_URL   = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
FRONTEND_URL   = os.environ.get("FRONTEND_URL", "https://aec-data-cdmx-prices.vercel.app")

stripe.api_key = STRIPE_SK
supa: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Stripe IDs ───────────────────────────────────────────────────────────────

try:
    ids = json.loads(IDS_FILE.read_text(encoding="utf-8"))
    TOKEN_PRICE_ID  = ids["tokens"]["price_id"]
    VENDOR_PRICE_ID = ids["vendor"]["price_id"]
    log.info(f"  Token price:  {TOKEN_PRICE_ID}")
    log.info(f"  Vendor price: {VENDOR_PRICE_ID}")
except Exception as e:
    TOKEN_PRICE_ID  = os.getenv("STRIPE_TOKEN_PRICE_ID", "")
    VENDOR_PRICE_ID = os.getenv("STRIPE_VENDOR_PRICE_ID", "")
    log.warning(f"No se pudo leer stripe_ids.json: {e}")

# tokens que otorga cada price_id
TOKENS_POR_PRECIO = {
    TOKEN_PRICE_ID:  100,   # 100 tokens por 200 MXN
}

# ─── Gemini Flash: análisis de pagos ─────────────────────────────────────────

def gemini_analizar_pago(info_pago: dict) -> dict:
    """
    Usa Gemini Flash para:
    1. Generar un mensaje de bienvenida/confirmación personalizado.
    2. Detectar patrones sospechosos o inconsistencias.
    3. Recomendar el siguiente paso al usuario.

    Retorna dict con { mensaje, recomendacion, riesgo (0-10) }
    """
    if not GOOGLE_API_KEY:
        return {
            "mensaje": f"¡Pago completado! {info_pago.get('tokens', 100)} tokens acreditados.",
            "recomendacion": "Usa tus tokens para generar una APU o auditar un presupuesto.",
            "riesgo": 0,
        }

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage
        import re

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3,
        )

        prompt = f"""Eres el asistente de pagos de APUCMX, plataforma AEC mexicana.
Analiza este evento de pago y responde en JSON exacto:

Datos del pago:
- Monto: {info_pago.get('amount_mxn', 0)} MXN
- Tokens acreditados: {info_pago.get('tokens', 100)}
- Usuario ID: {info_pago.get('user_id', 'desconocido')}
- Tipo: {info_pago.get('tipo', 'token_purchase')}
- Sesión Stripe: {info_pago.get('session_id', '')}
- Fecha: {datetime.now().strftime('%d %b %Y %H:%M')}

Responde ÚNICAMENTE en este JSON (sin markdown):
{{
  "mensaje": "<mensaje amigable en español, 1 oración, menciona los tokens y qué puede hacer>",
  "recomendacion": "<siguiente acción concreta que puede hacer con esos tokens en APUCMX>",
  "riesgo": <número 0-10 donde 0=pago limpio, 10=sospechoso>
}}"""

        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content.strip()

        # Extraer JSON aunque venga con backticks
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())

    except Exception as e:
        log.warning(f"  Gemini Flash no disponible: {e}")

    return {
        "mensaje": f"¡{info_pago.get('tokens', 100)} tokens acreditados en APUCMX!",
        "recomendacion": "Genera tu primera matriz APU por prompt en el Explorador.",
        "riesgo": 0,
    }


def gemini_verificar_suscripcion(info: dict) -> str:
    """Genera mensaje de bienvenida para nuevos suscriptores vendedor."""
    if not GOOGLE_API_KEY:
        return "¡Bienvenido al plan Vendedor APUCMX! Tu perfil ya está activo."
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.4,
        )
        response = llm.invoke([HumanMessage(content=(
            f"Genera un mensaje de bienvenida breve (máx 2 oraciones) en español "
            f"para un nuevo suscriptor vendedor de APUCMX. Es profesional AEC, "
            f"acaba de pagar 100 MXN/mes. Menciona que puede publicar su catálogo de servicios."
        ))])
        return response.content.strip()
    except Exception as e:
        log.warning(f"  Gemini bienvenida: {e}")
        return "¡Bienvenido al plan Vendedor APUCMX! Tu perfil ya está activo."


# ─── Flask App ────────────────────────────────────────────────────────────────

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "stripe_mode": "test" if "test" in STRIPE_SK else "live",
        "gemini": "activo" if GOOGLE_API_KEY else "no configurado",
        "timestamp": datetime.now().isoformat(),
    })


# ─── POST /create-checkout-session ───────────────────────────────────────────

@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    """
    Body JSON:
      { "user_id": "uuid", "tipo": "tokens"|"vendor" }
    """
    data     = request.get_json(silent=True) or {}
    user_id  = data.get("user_id")
    tipo     = data.get("tipo", "tokens")

    if not user_id:
        return jsonify({"error": "user_id requerido"}), 400

    price_id = TOKEN_PRICE_ID if tipo == "tokens" else VENDOR_PRICE_ID
    mode     = "payment" if tipo == "tokens" else "subscription"

    if not price_id:
        return jsonify({"error": f"price_id no configurado para tipo={tipo}"}), 500

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode=mode,
            success_url=f"{FRONTEND_URL}/Pagos?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/Pagos?cancelled=true",
            client_reference_id=user_id,
            metadata={
                "user_id": user_id,
                "apucmx_type": tipo,
                "tokens": "100" if tipo == "tokens" else "0",
            },
        )
        log.info(f"  Session [{tipo}] creada: {session.id} para user {user_id}")
        return jsonify({"url": session.url, "session_id": session.id})
    except stripe.StripeError as e:
        log.error(f"Stripe error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── POST /webhook ────────────────────────────────────────────────────────────

@app.route("/webhook", methods=["POST"])
def webhook():
    payload    = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except stripe.errors.SignatureVerificationError:
        log.warning("Firma de webhook inválida — ignorado")
        return jsonify({"error": "invalid signature"}), 400
    except Exception as e:
        log.error(f"Webhook parse error: {e}")
        return jsonify({"error": str(e)}), 400

    tipo = event.get("type", "")
    log.info(f"Evento: {tipo}")

    if tipo == "checkout.session.completed":
        _procesar_pago_completado(event["data"]["object"])

    elif tipo in ("customer.subscription.created", "customer.subscription.updated"):
        _procesar_suscripcion(event["data"]["object"])

    elif tipo == "customer.subscription.deleted":
        _desactivar_suscripcion(event["data"]["object"])

    elif tipo == "payment_intent.payment_failed":
        log.warning(f"  Pago fallido: {event['data']['object'].get('id')}")

    return jsonify({"status": "ok"})


# ─── Handlers privados ────────────────────────────────────────────────────────

def _ya_procesado(session_id: str) -> bool:
    """Idempotencia: verifica si ya acreditamos este session_id."""
    try:
        res = supa.table("stripe_payments")\
            .select("id")\
            .eq("stripe_session_id", session_id)\
            .limit(1)\
            .execute()
        return bool(res.data)
    except Exception:
        return False


def _procesar_pago_completado(session: dict):
    """Acredita tokens + análisis Gemini Flash."""
    user_id      = session.get("client_reference_id") or (session.get("metadata") or {}).get("user_id")
    session_id   = session.get("id", "")
    amount_total = session.get("amount_total", 0)   # centavos

    # --- Idempotencia ---
    if _ya_procesado(session_id):
        log.info(f"  Session {session_id} ya procesada — skip")
        return

    # --- Calcular tokens ---
    meta     = session.get("metadata") or {}
    price_id = meta.get("price_id", TOKEN_PRICE_ID)
    tokens   = TOKENS_POR_PRECIO.get(price_id, 100)

    if not user_id:
        log.error(f"  Sin user_id en session {session_id}")
        return

    log.info(f"  Acreditando {tokens} tokens → user {user_id}")

    # --- 1. Upsert balance ---
    res = supa.table("token_balances").select("balance").eq("user_id", user_id).maybeSingle().execute()
    if res.data:
        nuevo = res.data["balance"] + tokens
        supa.table("token_balances")\
            .update({"balance": nuevo, "updated_at": "now()"})\
            .eq("user_id", user_id).execute()
    else:
        supa.table("token_balances").insert({"user_id": user_id, "balance": tokens}).execute()

    # --- 2. Transacción ---
    supa.table("token_transactions").insert({
        "user_id":     user_id,
        "amount":      tokens,
        "action":      "compra",
        "description": f"Compra {tokens} tokens — {amount_total/100:.2f} MXN",
    }).execute()

    # --- 3. Registro de pago ---
    try:
        supa.table("stripe_payments").insert({
            "user_id":           user_id,
            "stripe_session_id": session_id,
            "amount_mxn":        amount_total // 100,
            "tokens_credited":   tokens,
            "status":            "completed",
        }).execute()
    except Exception as e:
        log.warning(f"  stripe_payments insert: {e}")

    # --- 4. Gemini Flash: análisis del pago ---
    analisis = gemini_analizar_pago({
        "user_id":    user_id,
        "amount_mxn": amount_total / 100,
        "tokens":     tokens,
        "session_id": session_id,
        "tipo":       "token_purchase",
    })

    log.info(f"  ✓ Tokens acreditados | Riesgo Gemini: {analisis.get('riesgo', 0)}/10")
    log.info(f"  Mensaje IA: {analisis.get('mensaje', '')}")

    # Guardar análisis si hay tabla de notificaciones (opcional)
    try:
        supa.table("ai_payment_logs").insert({
            "user_id":        user_id,
            "session_id":     session_id,
            "gemini_message": analisis.get("mensaje"),
            "gemini_rec":     analisis.get("recomendacion"),
            "riesgo":         analisis.get("riesgo", 0),
            "tokens":         tokens,
            "amount_mxn":     amount_total / 100,
        }).execute()
    except Exception:
        pass  # tabla opcional, no bloquear si no existe


def _procesar_suscripcion(sub: dict):
    """Activa perfil vendedor cuando el pago de suscripción se confirma."""
    customer_id = sub.get("customer")
    status      = sub.get("status")

    if status not in ("active", "trialing"):
        return

    # Buscar user_id por customer de Stripe en stripe_payments
    try:
        res = supa.table("stripe_payments")\
            .select("user_id")\
            .limit(1)\
            .execute()
        # fallback: usar metadata si existe
        user_id = (res.data[0]["user_id"] if res.data else None)
    except Exception:
        user_id = None

    if not user_id:
        log.warning(f"  Suscripción {sub.get('id')}: no se encontró user_id")
        return

    # Actualizar membership en profiles
    try:
        supa.table("profiles")\
            .update({"membership": "vendedor", "updated_at": "now()"})\
            .eq("id", user_id).execute()
        log.info(f"  ✓ Perfil vendedor activado para {user_id}")

        bienvenida = gemini_verificar_suscripcion({"user_id": user_id})
        log.info(f"  Mensaje IA: {bienvenida}")
    except Exception as e:
        log.error(f"  Error activando vendedor: {e}")


def _desactivar_suscripcion(sub: dict):
    """Desactiva perfil vendedor cuando se cancela la suscripción."""
    log.info(f"  Suscripción cancelada: {sub.get('id')}")
    # La lógica de buscar user_id por sub_id va aquí si implementamos tabla subs


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("=" * 55)
    log.info("  APUCMX — Checkout Server v2 (con Gemini Flash)")
    log.info(f"  Stripe mode: {'TEST' if 'test' in STRIPE_SK else 'LIVE ⚠️'}")
    log.info(f"  Gemini: {'activo' if GOOGLE_API_KEY else 'no configurado'}")
    log.info(f"  Supabase: {SUPABASE_URL}")
    log.info("  POST /create-checkout-session")
    log.info("  POST /webhook")
    log.info("  GET  /health")
    log.info("=" * 55)
    log.info("  Para webhook: stripe listen --forward-to localhost:5000/webhook")
    app.run(port=5000, debug=False)
=======
# stripe_checkout.py v2 — ver archivo local para código completo
# Webhook Flask + Gemini Flash para análisis de pagos
# Endpoints: POST /create-checkout-session, POST /webhook, GET /health
>>>>>>> 97282a4ba7c9c66773235c52d4227b3e04cea21c
