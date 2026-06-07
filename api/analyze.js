export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });
    const prompt = `Eres un asistente que lee apuntes de un camionero francés. LEE SOLO los días anotados, NO inventes días.

SISTEMA DE NOTACIÓN (CRÍTICO):
═══════════════════════════════════════════════════════════════════
🔵 VOLANTE (círculo): 8:40 → 20:59 = horas CONDUCCIÓN (ToTH)
🔨 MARTILLO: horas CARGA/DESCARGA (THT = SOLO martillo)
D: Descanso diario entre días
ToTkm = km del día
ToTH = horas conducción SOLAMENTE
THT = horas martillo SOLAMENTE (NO incluye conducción)
TOTAL = ToTH + THT (aparece en LÍNEAS DOBLES)
THS = horas acumuladas semana
Bisem = horas acumuladas bisemanal (max 90h)
DD = descanso diario (11h mínimo)
DS = descanso semanal (fin de semana)
═══════════════════════════════════════════════════════════════════

TIPOS DE DESCANSO (CRÍTICO PARA DIETAS):
1. BLOQUE (descanso reducido EN CAMIÓN):
   - Fin de semana: ves círculo/conducción ANTES y DESPUÉS
   - DS pequeño (24h, 33h, 35h, etc.) EN EL CAMIÓN
   - DIETA COMPLETA (55€) - come EN el camión
   - CALCULA: recuperacion = 45h - DS (ej: 45-33h16 = 11h44)

2. PERNOCTA FUERA (D cruza a día siguiente):
   - D: 20:00 → 6:00 (pasa la noche fuera del camión)
   - DIETA COMPLETA (55€)

3. DESCANSO EN CASA (SIN apuntes):
   - Faltan días entre anotaciones = está EN CASA
   - SIN DIETA (come en casa)
   - Se usa para recuperar horas del bloque

4. CONDUCCIÓN + regresa a casa (NO hay D que cruza):
   - Conduce, no hay pernocta
   - SIN DIETA (vuelve a casa)

REGLAS ESTRICTAS: - SOLO extrae días que están ESCRITOS en la imagen - Si no lees un campo claramente, pon null, NUNCA inventes - NO añadas días en blanco ni días que no tengan anotaciones - SOLO JSON sin markdown:
{"dias":[{"fecha":"DD/MM/AA","diaSemana":"Sábado","lugar":"ciudad","totKm":533,"totH":"6h50","martillo":"1h58","totalDia":"8h48","THS":"38h25","DS":"35h16","DD":"35h16","tipoDescanso":"bloque","recuperacion":"9h44","dieta":"completa","esDescanso":true}]}`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { 
              type: 'image', 
              source: { 
                type: 'base64', 
                media_type: mediaType || 'image/jpeg', 
                data: image 
              } 
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Anthropic error: ${errText}` });
    }
    const data = await response.json();
    const txt = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = txt.replace(/```json|```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'JSON parse error: ' + clean.substring(0, 200) });
    }
    
    res.status(200).json(parsed);
  } catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: e.message });
  }
}
