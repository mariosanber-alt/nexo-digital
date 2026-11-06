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
