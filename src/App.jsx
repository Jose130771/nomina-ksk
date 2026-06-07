import { useState, useEffect } from "react";
const C={bg:"#0a0f1e",card:"#111827",border:"#1e293b",accent:"#f59e0b",accentDim:"#78350f",blue:"#3b82f6",green:"#10b981",red:"#ef4444",text:"#f1f5f9",muted:"#64748b",surface:"#1e293b"};
const T={tasaBase:14.0,tasaHex25:17.5,tasaHex50:21.0,majNoche:2.486,majDomingo:200,dietaFull:55,dietaHalf:25,abatement:0.17,ss:{salud:0.055,comp:0.0074,jubP:0.069,jubD:0.004,compT1:0.0479,conv:0.01125}};
const h2d=(s)=>{if(!s)return 0;const m=s.toString().match(/(\d+)h(\d+)?/i);if(m)return parseInt(m[1])+(parseInt(m[2]||0))/60;return parseFloat(s)||0;};
const d2h=(d)=>{const h=Math.floor(Math.abs(d));const m=Math.round((Math.abs(d)-h)*60);return`${h}h${m.toString().padStart(2,"0")}`;};
const fmt=(n)=>n.toFixed(2).replace(".",",")+"\u00a0€";
export default function App(){
  const[tab,setTab]=useState("fotos");
  const[imgs,setImgs]=useState([]);
  const[analizando,setAnalizando]=useState(false);
  const[dias,setDias]=useState([]);
  const[err,setErr]=useState(null);
  const[ok,setOk]=useState(null);
  const[data,setData]=useState({horasTrabajadas:0,horasExtra:0,horasNocturnas:0,domingosBloqueados:0,dietasCompletas:0,mediasDietas:0,diasVacaciones:0,primaResp:250,primaCalidad:400,anticipo:0});
  const handleFiles=(e)=>{const files=Array.from(e.target.files);files.forEach(f=>{const r=new FileReader();r.onload=(ev)=>setImgs(prev=>[...prev,{url:URL.createObjectURL(f),b64:ev.target.result.split(",")[1]}]);r.readAsDataURL(f);});setErr(null);setOk(null);};
  const analizarTodas=async()=>{
    if(!imgs.length)return;
    setAnalizando(true);setErr(null);setOk(null);
    let nuevos=[];
    for(const img of imgs){
      try{
        const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:img.b64, mediaType: img.type})});
        if(!res.ok)throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const p=await res.json();
        if(p.dias)nuevos=[...nuevos,...p.dias];
      }catch(e){console.error(e);setErr("Error: "+e.message);}
    }
    if(nuevos.length>0){
      setDias(prev=>{const ex=prev.map(d=>d.fecha);const f=nuevos.filter(d=>!ex.includes(d.fecha));return[...prev,...f].sort((a,b)=>{const pa=a.fecha.split("/").map(Number);const pb=b.fecha.split("/").map(Number);return pa[2]!==pb[2]?pa[2]-pb[2]:pa[1]!==pb[1]?pa[1]-pb[1]:pa[0]-pb[0];});});
      setOk(`✅ ${nuevos.length} días detectados`);
    }else if(!err){setErr("No se detectaron días. Comprueba las fotos.");}
    setImgs([]);setAnalizando(false);
  };
  useEffect(()=>{if(!dias.length)return;const t=tot();setData(prev=>({...prev,horasTrabajadas:parseFloat(t.tht.toFixed(2)),dietasCompletas:t.dc,mediasDietas:t.dm}));},[dias]);
  const tot=()=>{const t=dias.filter(d=>!d.esDescanso);return{tht:t.reduce((s,d)=>s+h2d(d.THT),0),noc:t.reduce((s,d)=>s+h2d(d.horasNocturnas),0),dc:t.filter(d=>d.dieta==="completa").length,dm:t.filter(d=>d.dieta==="media").length,km:t.reduce((s,d)=>s+(parseInt(d.totKm)||0),0)};};
  const calcN=(d)=>{const h=parseFloat(d.horasTrabajadas)||0,hex=parseFloat(d.horasExtra)||0,noche=parseFloat(d.horasNocturnas)||0,dom=parseFloat(d.domingosBloqueados)||0,dF=parseFloat(d.dietasCompletas)||0,dH=parseFloat(d.mediasDietas)||0,pR=parseFloat(d.primaResp)||0,pC=parseFloat(d.primaCalidad)||0,ant=parseFloat(d.anticipo)||0;const base=h*T.tasaBase,hexB=hex*T.tasaHex25,subBase=base+hexB,hexC=hex*T.tasaHex50,majN=noche*T.majNoche,majD=dom*T.majDomingo,bruto=subBase+hexC+majN+majD+pR+pC,bc=bruto*(1-T.abatement),ss=T.ss,deds=[bc*ss.salud,bc*ss.comp,bc*ss.jubP,bc*ss.jubD,bc*ss.compT1,bc*ss.conv],totDed=deds.reduce((s,v)=>s+v,0),reem=dF*T.dietaFull+dH*T.dietaHalf,total=bruto-totDed+reem;return{base,hexB,subBase,hexC,majN,majD,bruto,bc,deds,totDed,reem,total,neto:total-ant};};
  const to=tot();const nom=calcN(data);
  const Row=({label,value,bold,color})=>(<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,color:bold?C.accent:C.muted}}>{label}</span><span style={{fontSize:11,color:color||C.text,fontWeight:bold?"bold":"normal"}}>{fmt(value)}</span></div>);
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Courier New',monospace",color:C.text,paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",padding:"18px 16px 14px",borderBottom:`2px solid ${C.accent}`}}>
        <div style={{fontSize:10,color:C.accent,letterSpacing:4,marginBottom:3}}>KSK TRANSPORT INTERNATIONAL</div>
        <div style={{fontSize:21,fontWeight:"bold"}}>🚛 MI NÓMINA</div>
        <div style={{fontSize:10,color:C.muted,marginTop:2}}>ROTH Iosif — Chauffeur Routier — 150M</div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.card}}>
        {[{id:"fotos",label:"📸 FOTOS"},{id:"dias",label:`📋 DÍAS (${dias.filter(d=>!d.esDescanso).length})`},{id:"nomina",label:"💶 NÓMINA"}].map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"12px 4px",border:"none",background:"transparent",color:tab===t.id?C.accent:C.muted,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",fontFamily:"inherit",fontSize:11,fontWeight:"bold",letterSpacing:1,cursor:"pointer"}}>{t.label}</button>))}
      </div>
      <div style={{padding:16}}>
        {tab==="fotos"&&(<div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.accent,marginBottom:14,letterSpacing:2}}>SUBIR FOTOS DE APUNTES</div>
            <label style={{display:"block",padding:"18px 16px",border:`2px dashed ${C.accent}`,borderRadius:10,textAlign:"center",cursor:"pointer",color:C.accent,fontSize:13,letterSpacing:1}}>
              📷 ELEGIR FOTO(S)
              <input type="file" accept="image/*" multiple onChange={handleFiles} style={{position:"absolute",opacity:0,width:"1px",height:"1px"}}/>
            </label>
            {imgs.length>0&&(<div style={{marginTop:12}}>
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
                {imgs.map((img,i)=>(<div key={i} style={{position:"relative",flexShrink:0}}><img src={img.url} alt="" style={{height:80,width:80,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/><button onClick={()=>setImgs(prev=>prev.filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,background:C.red,border:"none",borderRadius:"50%",color:"#fff",width:20,height:20,cursor:"pointer",fontSize:11}}>✕</button></div>))}
              </div>
              <button onClick={analizarTodas} disabled={analizando} style={{width:"100%",marginTop:10,padding:14,background:analizando?C.accentDim:C.accent,border:"none",borderRadius:10,color:"#000",fontFamily:"inherit",fontSize:13,fontWeight:"bold",cursor:analizando?"not-allowed":"pointer",letterSpacing:1}}>{analizando?`⏳ ANALIZANDO ${imgs.length} FOTO(S)...`:`🤖 ANALIZAR ${imgs.length} FOTO(S)`}</button>
            </div>)}
            {err&&<div style={{marginTop:10,padding:10,background:"#450a0a",borderRadius:8,color:C.red,fontSize:12}}>⚠️ {err}</div>}
            {ok&&<div style={{marginTop:10,padding:10,background:"#052e16",borderRadius:8,color:C.green,fontSize:12}}>{ok}</div>}
          </div>
          {dias.length>0&&(<div style={{background:C.card,border:`1px solid ${C.green}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.green,marginBottom:10,letterSpacing:2}}>✅ ÚLTIMOS DÍAS</div>
            {dias.slice(-4).map(d=>(<div key={d.fecha} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><div><span style={{color:C.accent,fontSize:12,fontWeight:"bold"}}>{d.fecha}</span><span style={{color:C.muted,fontSize:10,marginLeft:8}}>{d.diaSemana}</span><div style={{fontSize:11}}>{d.lugar} — <span style={{color:C.green}}>THT: {d.THT}</span></div></div><button onClick={()=>setDias(prev=>prev.filter(x=>x.fecha!==d.fecha))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18}}>✕</button></div>))}
            {dias.length>4&&<div style={{color:C.muted,fontSize:11,marginTop:8,textAlign:"center"}}>+{dias.length-4} más → pestaña DÍAS</div>}
          </div>)}
          <div style={{background:C.surface,borderRadius:10,padding:14}}><div style={{fontSize:11,color:C.accent,fontWeight:"bold",marginBottom:8}}>💡 CÓMO USAR</div><div style={{fontSize:11,color:C.muted,lineHeight:2.2}}>1️⃣ Pulsa el botón amarillo<br/>2️⃣ Elige fotos de galería<br/>3️⃣ Puedes elegir varias a la vez<br/>4️⃣ Pulsa "Analizar"<br/>5️⃣ Ve a NÓMINA para el resultado</div></div>
        </div>)}
        {tab==="dias"&&(<div>
          <div style={{background:C.card,border:`1px solid ${C.accent}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.accent,marginBottom:12,letterSpacing:2}}>📊 TOTALES DEL MES</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[{label:"Horas trabajo",value:d2h(to.tht),color:C.green},{label:"Km totales",value:to.km.toLocaleString("es"),color:C.blue},{label:"Dietas completas",value:to.dc+" días",color:C.accent},{label:"H. nocturnas",value:d2h(to.noc),color:C.muted}].map(item=>(<div key={item.label} style={{background:C.surface,borderRadius:8,padding:10}}><div style={{fontSize:10,color:C.muted}}>{item.label}</div><div style={{fontSize:17,fontWeight:"bold",color:item.color}}>{item.value}</div></div>))}
            </div>
            <button onClick={()=>{setData(prev=>({...prev,horasTrabajadas:Math.round(to.tht*100)/100,horasExtra:Math.max(0,Math.round((to.tht-186.34)*100)/100),horasNocturnas:Math.round(to.noc*100)/100,dietasCompletas:to.dc,mediasDietas:to.dm}));setTab("nomina");}} style={{width:"100%",padding:12,background:C.accent,border:"none",borderRadius:10,color:"#000",fontFamily:"inherit",fontSize:12,fontWeight:"bold",cursor:"pointer",letterSpacing:1}}>→ CALCULAR NÓMINA</button>
          </div>
          {dias.length===0?(<div style={{textAlign:"center",color:C.muted,padding:40,fontSize:13}}>Sin días. Sube fotos en 📸</div>):dias.map(d=>(<div key={d.fecha} style={{background:d.esDescanso?C.surface:C.card,borderLeft:`3px solid ${d.esDescanso?C.muted:d.dieta==="completa"?C.green:C.accent}`,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{color:C.accent,fontWeight:"bold",fontSize:13}}>{d.fecha}</span><span style={{color:C.muted,fontSize:10,marginLeft:8}}>{d.diaSemana}</span>{d.esDescanso&&<span style={{marginLeft:8,fontSize:10,background:C.surface,padding:"2px 6px",borderRadius:4,color:C.muted}}>DESCANSO</span>}</div><button onClick={()=>setDias(prev=>prev.filter(x=>x.fecha!==d.fecha))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18}}>✕</button></div>{!d.esDescanso&&(<div style={{marginTop:6,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}><div style={{fontSize:10}}><div style={{color:C.muted}}>THT</div><div style={{color:C.green,fontWeight:"bold"}}>{d.THT}</div></div><div style={{fontSize:10}}><div style={{color:C.muted}}>Km</div><div style={{color:C.blue,fontWeight:"bold"}}>{d.totKm}</div></div><div style={{fontSize:10}}><div style={{color:C.muted}}>Dieta</div><div style={{color:d.dieta==="completa"?C.green:C.muted,fontWeight:"bold"}}>{d.dieta==="completa"?"✅ FULL":d.dieta==="media"?"½":"❌"}</div></div>{h2d(d.horasNocturnas)>0&&<div style={{fontSize:10,gridColumn:"span 3"}}><span style={{color:C.muted}}>🌙 </span><span style={{color:C.blue}}>{d.horasNocturnas}</span></div>}{d.lugar&&<div style={{fontSize:10,color:C.muted,gridColumn:"span 3"}}>📍 {d.lugar}</div>}</div>)}</div>))}
        </div>)}
        {tab==="nomina"&&(<div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.accent,marginBottom:12,letterSpacing:2}}>⚙️ DATOS DEL MES</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{key:"horasTrabajadas",label:"Horas trabajadas"},{key:"horasExtra",label:"Horas extra"},{key:"horasNocturnas",label:"H. nocturnas"},{key:"domingosBloqueados",label:"Domingos bloq."},{key:"dietasCompletas",label:"Dietas completas"},{key:"mediasDietas",label:"Medias dietas"},{key:"diasVacaciones",label:"Días vacaciones"},{key:"primaResp",label:"Prima Resp. €"},{key:"primaCalidad",label:"Prima Calidad €"},{key:"anticipo",label:"Anticipo €"}].map(({key,label})=>(<div key={key}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>{label}</div><input type="number" value={data[key]} onChange={e=>setData(prev=>({...prev,[key]:e.target.value}))} style={{width:"100%",padding:"8px 10px",background:C.surface,border:`1px solid ${C.accent}`,borderRadius:6,color:C.accent,fontFamily:"inherit",fontSize:13,boxSizing:"border-box"}}/></div>))}
            </div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,color:C.accent,marginBottom:12,letterSpacing:2}}>📊 DESGLOSE</div>
            <Row label="Salario base" value={nom.base}/><Row label="Horas equiv. 25%" value={nom.hexB}/><Row label="SUBTOTAL BASE" value={nom.subBase} bold color={C.accent}/><Row label="Horas extra 50%" value={nom.hexC}/><Row label="Majoration noche" value={nom.majN}/><Row label="Bloqué dimanche" value={nom.majD}/><Row label="Prima Responsabilidad" value={parseFloat(data.primaResp)||0}/><Row label="Prima Calidad" value={parseFloat(data.primaCalidad)||0}/>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`2px solid ${C.green}`,marginTop:4}}><span style={{fontSize:13,color:C.green,fontWeight:"bold"}}>SALARIO BRUTO</span><span style={{fontSize:13,color:C.green,fontWeight:"bold"}}>{fmt(nom.bruto)}</span></div>
            <div style={{margin:"8px 0 4px",fontSize:11,color:C.muted}}>Base cotización (−17%): {fmt(nom.bc)}</div>
            {[["SS Salud 5,5%",0],["SS Comp. 0,74%",1],["Jubilación 6,9%",2],["Jubilación despl 0,4%",3],["Comp. T1 4,79%",4],["Convenio 1,125%",5]].map(([label,i])=>(<div key={label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,color:C.muted}}>{label}</span><span style={{fontSize:11,color:C.red}}>−{fmt(nom.deds[i])}</span></div>))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.red}`}}><span style={{fontSize:12,color:C.red,fontWeight:"bold"}}>TOTAL DEDUCCIONES</span><span style={{fontSize:12,color:C.red,fontWeight:"bold"}}>−{fmt(nom.totDed)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,marginTop:6}}><span style={{fontSize:11,color:C.muted}}>Reembolso dietas</span><span style={{fontSize:11,color:C.green}}>+{fmt(nom.reem)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,color:C.text,fontWeight:"bold"}}>TOTAL A COBRAR</span><span style={{fontSize:12,color:C.text,fontWeight:"bold"}}>{fmt(nom.total)}</span></div>
            {parseFloat(data.anticipo)>0&&(<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,color:C.muted}}>Anticipo</span><span style={{fontSize:11,color:C.red}}>−{fmt(parseFloat(data.anticipo))}</span></div>)}
          </div>
          <div style={{background:"linear-gradient(135deg,#064e3b,#065f46)",border:`2px solid ${C.green}`,borderRadius:14,padding:20,textAlign:"center"}}>
            <div style={{fontSize:12,color:C.green,letterSpacing:3,marginBottom:8}}>🎯 NETO ESTIMADO</div>
            <div style={{fontSize:36,fontWeight:"bold",color:"#fff"}}>{fmt(nom.neto)}</div>
            <div style={{fontSize:11,color:C.green,marginTop:6}}>Estimación ±50€ respecto a la nómina real</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
