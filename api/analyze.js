export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const prompt = `Eres un asistente que lee apuntes de un camionero francés. Sistema:
- Círculo/volante = hora salida → hora parada = horas conducción
- D = descanso: hora parada → hora salida día siguiente → horas descanso
- Tot km = km del día, Tot h = horas conducción
- Martillo = horas carga/descarga
- THT = total horas trabajo (conducción + carga/descarga)
- THS = horas semana, Bisem = bisemanal, DD = descanso diario, DS = descanso semanal
- Casa = día en casa esDescanso true
- Descanso D que cruza día siguiente = dieta completa
- Horas nocturnas = entre 21:00 y 06:00
Extrae TODOS los días. SOLO JSON sin markdown:
{"dias":[{"fecha":"DD/MM/AA","diaSemana":"Lunes","lugar":"ciudad","totKm":0,"totH":"8h30","martillo":"1h20","THT":"9h50","dieta":"completa","horasNocturnas":"0h00","esDescanso":false}]}`;

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
