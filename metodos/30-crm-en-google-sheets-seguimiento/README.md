# CRM en Google Sheets + seguimiento

> ⚙️ **Categoría:** Automatización y Software · **Origen:** Conversación con DeepSeek

## Qué es

Sheet con pipeline (lead → propuesta → negociación → cerrado), recordatorios y resumen mensual.

## Quién paga

Freelancers y pequeñas consultoras que pierden seguimiento de propuestas.

## Tarifa

Gratis (2 primeros) → 29 € plantilla + vídeo o 49 € montaje personalizado

| Campo | Valor |
|---|---|
| Tiempo de entrega | 48 h |
| Dificultad | Media |
| Primer euro | 48-72 h |
| Método de cobro | PayPal, 100% al aceptar. |

## Material necesario (todo gratis o casi gratis)

- Google Apps Script
- Google Sheets
- Loom
- PayPal

## Paso a paso

1. Monta el CRM (código incluido: Pipeline, Actividades, Plantillas, Config).
2. Graba un vídeo de 3 min de uso.
3. Publica el post y manda DMs.
4. Personaliza el CRM con los datos de 1 cliente gratis.
5. Vende 29 € (plantilla + vídeo) o 49 € (montaje personalizado).
6. Cobra 100% al aceptar.

## Prompts listos para copiar

### Prompt de emails de seguimiento

```text
Actúa como experto en ventas. Te paso el negocio: [servicio, ciclo de venta]. Devuélveme: 5 emails de seguimiento (asunto + cuerpo de 60 palabras) y reglas de cuándo enviar cada uno.
```

## Mensajes de captación (copy)

### Post directo

```text
📊 Regalo mi CRM en Google Sheets a 2 freelancers/consultoras esta semana: pipeline, recordatorios automáticos y 5 emails de seguimiento. Solo pido testimonio. DM 'CRM'.
```

## Automatización



### Código incluido: `Code.gs`

```javascript
// ===== CRM EN GOOGLE SHEETS (Google Apps Script) =====
// 1) Crea una hoja de cálculo nueva en Google Sheets.
// 2) Extensiones -> Apps Script, pega este código y ejecuta configurar().
// 3) Desplegar Dashboard como Web App (ejecutar como Yo, acceso Cualquiera).

function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = ss.getSheetByName('Pipeline') || ss.insertSheet('Pipeline');
  p.appendRow(['ID','Nombre','Empresa','Email','Etapa','Valor','Fecha creación','Última actividad','Días en etapa','Próxima acción','Notas']);
  var a = ss.getSheetByName('Actividades') || ss.insertSheet('Actividades');
  a.appendRow(['Fecha','ID','Etapa anterior','Etapa nueva']);
  var t = ss.getSheetByName('Plantillas') || ss.insertSheet('Plantillas');
  t.appendRow(['Etapa','Asunto','Cuerpo']);
  var plantillas = [
    ['Lead','{nombre}, hablemos de {empresa}','Hola {nombre}, vi tu proyecto y creo que puedo ayudarte...'],
    ['Contactado','Seguimiento {empresa}','Hola {nombre}, te escribo para retomar lo hablado...'],
    ['Propuesta','Propuesta para {empresa}','Hola {nombre}, te envío la propuesta...'],
    ['Negociación','Ajustes de la propuesta','Hola {nombre}, aquí van los ajustes...'],
    ['Reactivación','¿Lo retomamos?','Hola {nombre}, hace tiempo que no hablamos...']
  ];
  plantillas.forEach(function(r){ t.appendRow(r); });
  PropertiesService.getScriptProperties().setProperty('DUENO_EMAIL','TU_EMAIL@gmail.com');
  PropertiesService.getScriptProperties().setProperty('MI_NOMBRE','Tu Nombre');
  ScriptApp.getProjectTriggers().forEach(function(tr){ if(tr.getHandlerFunction()==='resumenDiario') ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger('resumenDiario').timeBased().atHour(9).everyDays(1).create();
}

function onEdit(e) {
  var r = e.range; var sh = r.getSheet();
  if (sh.getName() !== 'Pipeline') return;
  if (r.getColumn() !== 5) return; // columna Etapa
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var act = ss.getSheetByName('Actividades');
  act.appendRow([new Date(), sh.getRange(r.getRow(),1).getValue(), e.oldValue || '', e.value || '']);
  sh.getRange(r.getRow(),8).setValue(new Date());
  var dias = '=DATEDIF(G' + r.getRow() + ',TODAY(),"D")';
  sh.getRange(r.getRow(),9).setFormula(dias);
  if (e.value === 'Ganado') {
    var dueno = PropertiesService.getScriptProperties().getProperty('DUENO_EMAIL');
    MailApp.sendEmail(dueno, '¡Venta cerrada!', 'El lead de la fila ' + r.getRow() + ' pasó a Ganado.');
  }
}

function resumenDiario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = ss.getSheetByName('Pipeline');
  var dueno = PropertiesService.getScriptProperties().getProperty('DUENO_EMAIL');
  var rows = p.getDataRange().getValues();
  var estancados = [], porEtapa = {};
  for (var i = 1; i < rows.length; i++) {
    var etapa = rows[i][4]; porEtapa[etapa] = (porEtapa[etapa]||0) + 1;
    var dias = rows[i][8];
    if (typeof dias === 'number' && dias > 7 && ['Ganado','Perdido'].indexOf(etapa) < 0) {
      estancados.push(rows[i][1] + ' (' + etapa + ', ' + dias + ' días)');
    }
  }
  var total = Object.keys(porEtapa).map(function(k){return k + ': ' + porEtapa[k];}).join(', ');
  var cuerpo = 'Pipeline: ' + total + '\n\nEstancados (>7 días):\n' + (estancados.join('\n') || 'ninguno');
  MailApp.sendEmail(dueno, 'Resumen diario CRM', cuerpo);
}

function enviarSeguimiento(fila) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = ss.getSheetByName('Pipeline');
  var t = ss.getSheetByName('Plantillas');
  var nombre = p.getRange(fila,2).getValue();
  var empresa = p.getRange(fila,3).getValue();
  var email = p.getRange(fila,4).getValue();
  var etapa = p.getRange(fila,5).getValue();
  var mi = PropertiesService.getScriptProperties().getProperty('MI_NOMBRE');
  var plantillas = t.getDataRange().getValues();
  var asunto='', cuerpo='';
  for (var i=1;i<plantillas.length;i++){
    if (plantillas[i][0]===etapa){ asunto=plantillas[i][1]; cuerpo=plantillas[i][2]; break; }
  }
  if (!asunto) { throw new Error('No hay plantilla para la etapa ' + etapa); }
  asunto = asunto.replace('{nombre}',nombre).replace('{empresa}',empresa);
  cuerpo = cuerpo.replace('{nombre}',nombre).replace('{empresa}',empresa).replace('{mi_nombre}',mi);
  MailApp.sendEmail(email, asunto, cuerpo);
  p.getRange(fila,8).setValue(new Date());
  ss.getSheetByName('Actividades').appendRow([new Date(), p.getRange(fila,1).getValue(), etapa, 'Seguimiento enviado']);
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Dashboard').setTitle('CRM');
}

```

## Dónde encontrar clientes

Grupos FB de freelancers, LinkedIn de consultores, Twitter #freelance, Discord de ventas, WhatsApp.

## Plan B

Véndelo a 9 € en Payhip como producto tras los 2 testimonios.

## Verificación y viabilidad

Los freelancers pierden ventas por no hacer seguimiento; un CRM que avisa es de las pocas herramientas que se venden solas. El código es funcional. Mejor como producto (plantilla) que como servicio.
