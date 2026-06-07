export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const prompt = `Eres un asistente que lee apuntes manuscritos de un camionero. LEE SOLO lo que está escrito, NUNCA inventes datos.

SISTEMA DE NOTACIÓN EXACTO:
- 🔵 Círculo (volante/tacógrafo): a su derecha = hora salida → hora parada = horas conducidas (ToTH)
- D: a su derecha = hora parada → hora salida día siguiente → total horas descanso diario (DD)
- Tot km: km salida tacógrafo → km llegada. La resta = km del día
- Tot h: horas conducción del día (ToTH)
- 🔨 Martillo: horas carga/descarga (THT_solo_martillo)
- THT: Tot h + martillo = total horas trabajo del día
- THS: horas acumuladas de la semana
- Bisem: acumulado bisemanal (max 90h)
- DD: descanso diario
- DS: descanso semanal
- "24 Lu/Ma/Mi..." = día del mes con superíndice de día semana
- Casa = día en casa, sin trabajo, sin dieta
- Vace/Vacaciones = día de vacaciones

DIETAS:
- D que cruza al día siguiente (pernocta fuera) → dieta: "completa"
- Vuelve mismo día (sin pernocta) → dieta: "ninguna"
- Bloque fin de semana en camión (DS en camión) → dieta: "completa"
- Casa o vacaciones → dieta: "ninguna"

REGLAS ESTRICTAS:
- SOLO extrae días con anotaciones escritas en la imagen
- Si no puedes leer un campo, pon null
- NUNCA inventes km, horas, fechas ni lugares
- SOLO responde con JSON válido, sin markdown, sin texto extra

Formato JSON requerido:
{"dias":[{"fecha":"DD/MM/AA","diaSemana":"Lunes","lugar":null,"totKm":533,"ToTH":"6h50","THT_martillo":"1h10","THT":"8h00","THS":"38h25","DD":"11h00","DS":null,"tipoDescanso":null,"recuperacion":null,"dieta":"completa","esDescanso":false}]}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
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
