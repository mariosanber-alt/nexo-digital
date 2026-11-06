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
