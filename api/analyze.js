export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
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
