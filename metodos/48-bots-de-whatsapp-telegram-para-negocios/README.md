# Bots de WhatsApp/Telegram para negocios

> ⚙️ **Categoría:** Automatización y Software · **Origen:** Método nuevo (creado y verificado)

## Qué es

Crear un bot que responde preguntas frecuentes, recoge pedidos o agenda citas automáticamente.

## Quién paga

Negocios que reciben muchas consultas repetidas (restaurantes, clínicas, academias).

## Tarifa

49-99 € por bot básico + 15-30 €/mes mantenimiento

| Campo | Valor |
|---|---|
| Tiempo de entrega | 2-3 días |
| Dificultad | Alta |
| Primer euro | 1 semana |
| Método de cobro | PayPal/Bizum + mantenimiento mensual. |

## Material necesario (todo gratis o casi gratis)

- Python (gratis)
- Telegram Bot API (gratis) o WhatsApp Cloud API
- GitHub/Hosting gratuito (Render/Railway free)
- PayPal/Bizum

## Paso a paso

1. Aprende a crear un bot de Telegram (API gratuita, sin coste).
2. Define los flujos: FAQ, pedidos o citas.
3. Construye un bot demo con tu propio negocio.
4. Ofrécelo a 2 negocios por testimonio.
5. Cobra 49-99 € por bot + mantenimiento mensual.
6. Despliega en hosting gratuito (Render/Railway free tier).

## Prompts listos para copiar

### Prompt de flujo de bot

```text
Actúa como diseñador de conversaciones. Te paso el negocio: [sector, FAQ típicas]. Devuélveme el árbol de conversación del bot: saludo, menú de opciones, respuestas de FAQ, captura de pedido/cita y cierre. En formato de flujo.
```

## Mensajes de captación (copy)

### DM a negocio

```text
Hola [nombre], ¿cuántas veces al día respondes las mismas preguntas? Te monto un bot que las responde solo y recoge pedidos/citas. Te lo enseño gratis. ¿Te interesa?
```

## Automatización



### Código incluido: `bot_telegram.py`

```python
# BOT DE TELEGRAM BÁSICO (FAQ + pedidos) - Python
# Instala: pip install requests
# 1) Habla con @BotFather en Telegram -> /newbot -> copia el TOKEN
# 2) Pega el token abajo y ejecuta: python bot_telegram.py
import requests, time, json

TOKEN = "TU_TOKEN_AQUI"
BASE = f"https://api.telegram.org/bot{TOKEN}"

FAQ = {
    "horario": "Abrimos de lunes a sábado de 10:00 a 20:00.",
    "precio": "Consulta nuestra carta en: [enlace]. ¡Te esperamos!",
    "pedido": "Para hacer un pedido, escribe: PEDIDO [tu pedido] y te confirmamos."
}

def send(chat_id, text):
    requests.post(f"{BASE}/sendMessage", json={"chat_id": chat_id, "text": text})

def handle(text):
    t = text.lower()
    for k, v in FAQ.items():
        if k in t:
            return v
    if t.startswith("pedido"):
        return f"Pedido registrado: {text[7:]} ✅ Te confirmaremos por aquí."
    return ("Hola 👋 Soy el asistente de [NEGOCIO]. Escribe: horario, precio o pedido. "
            "Si necesitas hablar con una persona, escribe HUMANO.")

def main():
    print("Bot activo. Ctrl+C para parar.")
    offset = 0
    while True:
        r = requests.get(f"{BASE}/getUpdates", params={"offset": offset, "timeout": 30}).json()
        for u in r.get("result", []):
            offset = u["update_id"] + 1
            msg = u.get("message")
            if not msg or "text" not in msg:
                continue
            send(msg["chat"]["id"], handle(msg["text"]))
        time.sleep(1)

if __name__ == "__main__":
    main()

```

## Dónde encontrar clientes

Google Maps (restaurantes/clínicas), Instagram de negocios, grupos FB de pymes, WhatsApp de conocidos.

## Plan B

Crea un bot para tu propio proyecto y úsalo de demo.

## Verificación y viabilidad

Automatizar consultas repetidas ahorra horas al negocio; valor claro y recurrente (mantenimiento). Telegram es 100% gratis; WhatsApp Cloud API tiene tier gratuito con límites.
