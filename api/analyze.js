export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image } = req.body;
    const prompt = `Eres un asistente que lee apuntes de un camionero francés. Sistema de notación:
- Círculo/volante = hora salida → hora parada = horas conducción del día
- D = descanso: hora parada → hora salida día siguiente → total horas descanso
- Tot km = km del día (llegada-salida tacógrafo)
- Tot h = horas conducción
- Martillo = horas carga/descarga
- THT = total horas trabajo (conducción + carga/descarga)
- THS = horas semana, Bisem = bisemanal, DD = descanso diario, DS = descanso semanal
- Casa = día en casa, esDescanso true
- Si descanso D cruza a día siguiente = dieta completa (pernocta fuera)
- Horas nocturnas = tramos entre 21:00 y 06:00

Extrae TODOS los días visibles. SOLO JSON sin markdown:
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
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    const txt = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
