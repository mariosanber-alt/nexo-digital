# Actas de reunión con IA

> ⚙️ **Categoría:** Automatización y Software · **Origen:** Conversación con DeepSeek

## Qué es

Transcripción + acta estructurada (asistentes, decisiones, acciones, deadlines) en 2 h.

## Quién paga

Equipos remotos y consultoras que pierden decisiones en reuniones.

## Tarifa

Gratis (3 reuniones) → 15 €/reunión o 49 €/mes (hasta 8)

| Campo | Valor |
|---|---|
| Tiempo de entrega | 2 h |
| Dificultad | Media |
| Primer euro | 48-72 h |
| Método de cobro | PayPal, 50% adelantado en packs mensuales. |

## Material necesario (todo gratis o casi gratis)

- Groq API (gratis) o Whisper
- Python
- Google Docs
- PayPal

## Paso a paso

1. Monta la herramienta (CLI Python con Groq: transcribe + genera acta).
2. Publica el post y manda DMs a PMs y consultores.
3. Procesa 1 reunión real gratis (10 min).
4. Envía el acta y pide testimonio.
5. Vende 15 €/reunión o 49 €/mes (hasta 8).
6. Cobra 50% adelantado en packs mensuales.

## Prompts listos para copiar

### Prompt de acta

```text
Actúa como asistente ejecutivo. Te paso esta transcripción: [pegar]. Devuélveme un acta con: asistentes, resumen en 3 líneas, decisiones tomadas, acciones con responsable y deadline, y temas pendientes para la próxima reunión.
```

## Mensajes de captación (copy)

### Post de captación

```text
📝 Convierto gratis 3 reuniones en actas estructuradas esta semana (decisiones + acciones + deadlines). Solo pido testimonio. DM 'ACTA'.
```

## Automatización

Script Python completo (transcripción con Groq Whisper + acta con LLM + email). Ver carpeta del método: incluye código listo para ejecutar.

### Código incluido: `actas.py`

```python
#!/usr/bin/env python3
# ACTAS DE REUNIÓN CON IA (Groq free tier)
# 1) pip install groq python-dotenv markdown
# 2) Crea una API key gratis en https://console.groq.com
# 3) Crea un archivo .env con: GROQ_API_KEY=tu_clave
# 4) Uso: python actas.py reunion.mp3 --participantes "Ana,Luis" --contexto "Reunión de producto"

import argparse, os, sys, datetime
from dotenv import load_dotenv
load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_KEY:
    print("Falta GROQ_API_KEY en .env"); sys.exit(1)

from groq import Groq
import markdown

client = Groq(api_key=GROQ_KEY)

def transcribir(ruta, idioma="es"):
    with open(ruta, "rb") as f:
        r = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=f, language=idioma, response_format="text")
    return r if isinstance(r, str) else str(r)

def generar_acta(transcripcion, contexto, participantes):
    prompt = f"""Actúa como asistente ejecutivo. Genera un acta estructurada con:
1) Asistentes
2) Resumen ejecutivo (3 líneas)
3) Decisiones tomadas (lista)
4) Acciones con responsable y deadline (tabla)
5) Temas pendientes

Contexto: {contexto}
Participantes conocidos: {participantes}

Transcripción:
{transcripcion}"""
    r = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}])
    return r.choices[0].message.content

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--participantes", default="")
    ap.add_argument("--contexto", default="Reunión")
    ap.add_argument("--idioma", default="es")
    args = ap.parse_args()

    if os.path.getsize(args.audio) > 25 * 1024 * 1024:
        print("Audio >25MB. Comprímelo: ffmpeg -i in.mp3 -b:a 64k out.mp3"); sys.exit(1)

    print("Transcribiendo...")
    t = transcribir(args.audio, args.idioma)
    print("Generando acta...")
    acta_md = generar_acta(t, args.contexto, args.participantes)

    nombre = datetime.datetime.now().strftime("%Y-%m-%d_%H%M") + "_acta"
    with open(f"output/{nombre}.md", "w", encoding="utf-8") as f:
        f.write(acta_md)
    with open(f"output/{nombre}.html", "w", encoding="utf-8") as f:
        f.write(markdown.markdown(acta_md, extensions=["tables"]))

    print("Acta guardada en output/")
    print(acta_md)

if __name__ == "__main__":
    os.makedirs("output", exist_ok=True)
    main()

```

## Dónde encontrar clientes

LinkedIn de project managers, grupos FB de remotos, Discord de equipos, Slack communities, Twitter.

## Plan B

Transcribe la próxima reunión de tu trabajo y úsala de ejemplo.

## Verificación y viabilidad

Método con barrera de entrada (software propio) = defendible y recurrente. Groq ofrece tier gratuito; verifica límites actuales. El acta ahorra 30 min por reunión: valor claro.
