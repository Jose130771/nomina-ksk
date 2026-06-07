const prompt = `Eres un asistente que lee apuntes de un camionero francés. Lee con MÁXIMA PRECISIÓN.

SISTEMA DE NOTACIÓN (CRÍTICO):
═══════════════════════════════════════════════════════════════════
🔵 VOLANTE (círculo): 8:40 → 20:59 = horas CONDUCCIÓN (ToTH en apuntes)
🔨 MARTILLO: horas CARGA/DESCARGA (THT en apuntes = SOLO martillo, SIN conducción)
D: Descanso diario entre días
ToTkm = km del día (el número que el camionero calcula)
ToTH = horas conducción SOLAMENTE
THT = horas martillo SOLAMENTE (NO incluye conducción)
TOTAL = ToTH + THT (aparece en las LÍNEAS DOBLES que unen ambos conceptos)
THS = horas acumuladas semana
Bisem = horas acumuladas bisemanal (max 90h)
DD = descanso diario (11h mínimo)
DS = descanso semanal (35h mínimo, normalmente fin de semana)
Casa = día en casa = sin dieta
═══════════════════════════════════════════════════════════════════

CRÍTICO PARA DIETAS:
- Pernocta = pasa la noche fuera (línea D cruza a día siguiente) = DIETA COMPLETA (55€)
- Sin pernocta = regresa a casa o descanso en casa = SIN DIETA
- Pernocta parcial = MEDIA DIETA (25€)

EXTRAE TODOS LOS DÍAS. SOLO JSON sin markdown, sin backticks:
{"dias":[{"fecha":"DD/MM/AA","diaSemana":"Lunes","lugar":"ciudad","totKm":0,"totH":"8h30","martillo":"1h20","totalDia":"9h50","THS":"16h02","Bisem":"42h31","DD":"11h06","dieta":"completa","horasNocturnas":"0h00","esDescanso":false,"pernocta":true}]}`;
