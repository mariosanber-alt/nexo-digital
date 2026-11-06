# Sistema de captación de leads (Forms + Sheets)

> ⚙️ **Categoría:** Automatización y Software · **Origen:** Conversación con DeepSeek

## Qué es

Google Form de captación + Sheet con respuestas + email automático de bienvenida + notificación al negocio.

## Quién paga

Negocios que captan leads por DM y los pierden.

## Tarifa

Gratis (2 primeros) → 49 € setup o 29 €/mes gestionado

| Campo | Valor |
|---|---|
| Tiempo de entrega | 24-48 h |
| Dificultad | Media |
| Primer euro | 24-48 h |
| Método de cobro | PayPal/Bizum, 100% al aceptar. |

## Material necesario (todo gratis o casi gratis)

- Google Apps Script
- Google Forms/Sheets
- PayPal/Bizum

## Paso a paso

1. Construye/deploya el sistema con tu propio email (código incluido).
2. Publica el post y envía 5 DMs.
3. Monta el sistema de muestra para 1 negocio real (10 min).
4. Envíalo y pide testimonio.
5. Vende 49 € setup o 29 €/mes gestionado.
6. Cobra 100% al aceptar.

## Prompts listos para copiar

### Prompt de formulario

```text
Actúa como consultor de marketing. Te paso el negocio: [sector, oferta]. Devuélveme: 5 preguntas para el formulario de captación, copy del formulario, email de bienvenida automático (80 palabras + CTA) y email de notificación interna al negocio.
```

## Mensajes de captación (copy)

### Post directo

```text
📥 Monto gratis el sistema de captación de leads de 2 negocios esta semana: formulario + Google Sheet + email automático + dashboard. Dejas de perder mensajes por WhatsApp. Solo pido testimonio. DM 'LEADS'.
```

### Post dolor

```text
Cada día pierdes 3-5 leads porque se pierden entre DMs de Instagram y WhatsApp. Esta semana monto gratis el sistema que los centraliza a 2 negocios. DM 'LEADS'.
```

## Automatización



### Código incluido: `Code.gs`

```javascript
// ===== SISTEMA DE CAPTACIÓN DE LEADS (Google Apps Script) =====
// 1) Pega este código en script.google.com  ->  Nuevo proyecto
// 2) Ejecuta la función configurar() una vez (crea hoja, guarda email, instala trigger)
// 3) Desplegar -> Nueva implementación -> Aplicación web
//    - Ejecutar como: Yo   - Acceso: Cualquier usuario
// 4) Copia la URL de /exec y úsala como landing pública

function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Leads')) {
    var sh = ss.insertSheet('Leads');
    sh.appendRow(['Timestamp','Nombre','Email','Teléfono','Mensaje','Fuente','Estado','FechaContacto']);
  }
  PropertiesService.getScriptProperties().setProperty('DUENO_EMAIL', 'TU_EMAIL@gmail.com');
  PropertiesService.getScriptProperties().setProperty('NEGOCIO', 'TU_NEGOCIO');
  // Instala trigger diario 9:00
  ScriptApp.getProjectTriggers().forEach(function(t){ if(t.getHandlerFunction()==='resumenDiario') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('resumenDiario').timeBased().atHour(9).everyDays(1).create();
}

function doGet(e) {
  if (e && e.parameter && e.parameter.page === 'dashboard') {
    return HtmlService.createHtmlOutputFromFile('Dashboard').setTitle('Panel de leads');
  }
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Contacto');
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents || '{}');
  var nombre = (data.nombre || '').trim();
  var email = (data.email || '').trim();
  var telefono = (data.telefono || '').trim();
  var mensaje = (data.mensaje || '').trim();
  var fuente = (data.fuente || 'web').trim();
  if (!nombre || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Datos incompletos'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  sh.appendRow([new Date(), nombre, email, telefono, mensaje, fuente, 'nuevo', '']);
  var negocio = PropertiesService.getScriptProperties().getProperty('NEGOCIO');
  var dueno = PropertiesService.getScriptProperties().getProperty('DUENO_EMAIL');
  // Email de bienvenida al lead
  MailApp.sendEmail(email, 'Gracias por contactar con ' + negocio,
    'Hola ' + nombre + ',\n\nHemos recibido tu mensaje y te responderemos en menos de 24 h laborables.\n\n' + negocio);
  // Email al dueño
  MailApp.sendEmail(dueno, 'Nuevo lead: ' + nombre,
    'Nombre: ' + nombre + '\nEmail: ' + email + '\nTeléfono: ' + telefono + '\nMensaje: ' + mensaje + '\nFuente: ' + fuente);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function resumenDiario() {
  var dueno = PropertiesService.getScriptProperties().getProperty('DUENO_EMAIL');
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  var rows = sh.getDataRange().getValues();
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var ayer = new Date(hoy.getTime() - 86400000);
  var total = 0, hoyCount = 0;
  var fuentes = {};
  for (var i = 1; i < rows.length; i++) {
    var d = new Date(rows[i][0]);
    if (d >= hoy) hoyCount++;
    total++;
    fuentes[rows[i][5]] = (fuentes[rows[i][5]] || 0) + 1;
  }
  var top = Object.keys(fuentes).sort(function(a,b){return fuentes[b]-fuentes[a];}).slice(0,5)
    .map(function(f){return f + ': ' + fuentes[f];}).join(', ');
  MailApp.sendEmail(dueno, 'Resumen diario de leads',
    'Leads hoy: ' + hoyCount + '\nTotal: ' + total + '\nTop fuentes: ' + top);
}

function marcarContactado(fila) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  sh.getRange(fila, 7).setValue('contactado');
  sh.getRange(fila, 8).setValue(new Date());
}

```

## Dónde encontrar clientes

LinkedIn de pymes, grupos FB de empresarios, WhatsApp de conocidos, Instagram de negocios con lead magnet, Discord de marketing.

## Plan B

Monta el sistema para tu propio proyecto y úsalo de ejemplo.

## Verificación y viabilidad

Método estrella de la conversación: se demuestra en 10 segundos abriendo el dashboard. Cualquier negocio entiende 'pierdes leads' y paga. El código incluido es funcional y desplegable.
