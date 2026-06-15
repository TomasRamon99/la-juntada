const $ = s => document.querySelector(s);
const money = n => "$" + Math.round(n).toLocaleString("es-AR");
const uid = () => Math.random().toString(36).slice(2,9);
const STORE = "laJuntada_v4";
const HIST = "laJuntada_hist";

// ---- planificador: tipos de juntada y porciones por género ----
function plnum(v){ return (Math.round(v*10)/10).toLocaleString("es-AR"); }
function picadaItems(n){ return [
  {ic:"🌭",name:"Picada: salame (1 u ≈ 200 g)",qty:Math.ceil(n/4),unit:"u",step:1},
  {ic:"🧀",name:"Picada: queso (1 u ≈ 300 g)",qty:Math.ceil(n/4),unit:"u",step:1},
  {ic:"🥨",name:"Picada: snacks",text:"a gusto"},
]; }
const PLAN_TYPES = {
  asado:{ note:"Carne: 500 g por hombre, 400 g por mujer. Chorizos y achuras aparte.", rows:(h,m)=>{const n=h+m;const carne=Math.round((h*0.5+m*0.4)*10)/10;return[
    {ic:"🥩",name:"Carne (cortes variados)",qty:carne,unit:"kg",step:0.5},
    {ic:"🌭",name:"Chorizos (1 kg ≈ 8 a 10 u)",qty:Math.round(n),unit:"u",step:1},
    {ic:"🫀",name:"Achuras (100 g por persona)",qty:Math.round(n*0.1*10)/10,unit:"kg",step:0.1},
    {ic:"🥗",name:"Ensalada (tomate, lechuga, mixta)",qty:Math.round(n*0.2*10)/10,unit:"kg",step:0.1},
    ...picadaItems(n),
    {ic:"🍞",name:"Pan",qty:Math.round(n*0.15*10)/10,unit:"kg",step:0.1},
    {ic:"🔥",name:"Carbón",qty:Math.round((carne+1)*10)/10,unit:"kg",step:0.5},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  choripan:{ note:"2 choripanes por persona. Un pan por chori.", rows:(h,m)=>{const n=h+m;const ch=Math.round(n*2);return[
    {ic:"🌭",name:"Chorizos",qty:ch,unit:"u",step:1},
    {ic:"🍞",name:"Pan (para chori)",qty:ch,unit:"u",step:1},
    {ic:"🥬",name:"Lechuga",qty:Math.round(n*0.1*10)/10,unit:"kg",step:0.1},
    {ic:"🍅",name:"Tomate",qty:Math.round(n*0.5),unit:"u",step:1},
    {ic:"🌿",name:"Chimichurri",text:"a gusto"},
    ...picadaItems(n),
    {ic:"🔥",name:"Carbón",qty:Math.round(n*0.4*10)/10,unit:"kg",step:0.5},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  bebidas:{ note:"Para juntarse a tomar algo. Cerveza ½ L y fernet ~⅛ L por persona.", rows:(h,m)=>{const n=h+m;return[
    {ic:"🍺",name:"Cerveza",qty:Math.round(n*0.5*10)/10,unit:"L",step:0.5},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
    {ic:"🍋",name:"Fernet",qty:Math.round(n*0.125*4)/4,unit:"L",step:0.25},
    {ic:"🧊",name:"Hielo",qty:Math.round(n*0.25*10)/10,unit:"kg",step:0.5},
    {ic:"🫒",name:"Para picar",text:"a gusto"},
  ];}},
  pizza:{ note:"Porciones: 4 por hombre (½ pizza), 3 por mujer. Cada pizza = 8 porciones.", rows:(h,m)=>{const n=h+m;const porc=Math.round(h*4+m*3);return[
    {ic:"🍕",name:"Pizzas (8 porciones)",qty:Math.ceil(porc/8),unit:"u",step:1},
    ...picadaItems(n),
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  empanadas:{ note:"6 empanadas por hombre, 4 por mujer.", rows:(h,m)=>{const n=h+m;return[
    {ic:"🥟",name:"Empanadas (12 u = docena)",qty:Math.round(h*6+m*4),unit:"u",step:6},
    ...picadaItems(n),
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  pizzaemp:{ note:"Combo mitad y mitad: la mitad pizza, la mitad empanadas.", rows:(h,m)=>{const n=h+m;const porc=Math.round((h*4+m*3)/2);return[
    {ic:"🍕",name:"Pizzas (8 porciones)",qty:Math.ceil(porc/8),unit:"u",step:1},
    {ic:"🥟",name:"Empanadas (12 u = docena)",qty:Math.round((h*6+m*4)/2),unit:"u",step:6},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  pastas:{ note:"Pasta: 200 g por hombre, 150 g por mujer.", rows:(h,m)=>{const n=h+m;return[
    {ic:"🍝",name:"Pasta",qty:Math.round((h*0.2+m*0.15)*10)/10,unit:"kg",step:0.1},
    {ic:"🥫",name:"Salsa",qty:Math.round(n*0.2*10)/10,unit:"L",step:0.1},
    {ic:"🧀",name:"Queso rallado",qty:Math.round(n*0.03*100)/100,unit:"kg",step:0.05},
    {ic:"🍞",name:"Pan",qty:Math.round(n),unit:"u",step:1},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  picada:{ note:"Fiambre y queso: 250 g por hombre, 150 g por mujer.", rows:(h,m)=>{const n=h+m;return[
    {ic:"🧀",name:"Fiambres y quesos",qty:Math.round((h*0.25+m*0.15)*10)/10,unit:"kg",step:0.1},
    {ic:"🫒",name:"Picoteo (aceitunas, papas)",text:"a gusto"},
    {ic:"🍞",name:"Pan / grisines",qty:Math.round(n),unit:"u",step:1},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
  otras:{ note:"Cargá la comida a mano según lo que cocinen.", rows:(h,m)=>{const n=h+m;return[
    {ic:"🍽️",name:"Comida",text:"según lo que preparen"},
    {ic:"🍞",name:"Pan",qty:Math.round(n),unit:"u",step:1},
    {ic:"🥤",name:"Gaseosa (2,5 L)",qty:Math.ceil(n/3),unit:"u",step:1},
  ];}},
};
const DEFAULT_RULES = [
  "El organizador decide. No se aceptan quejas sobre lo comprado. Si a alguien no le gusta: «lo hubieses comprado vos».",
  "La picada se larga a la hora estipulada o cuando esté la mayoría — y siempre se divide entre todos.",
  "El asado no es solo comer. No dejes al asador ni al organizador solo con todo: hay que ir temprano y dar una mano.",
  "El que pone la casa ya hizo un esfuerzo de más. Ayudá a limpiar, o por lo menos a acomodar antes de irte. 🧹",
];

let state = normalize(fromURL() || load() || seed());
let planWork = [];

function seed(){
  const ppl = ["Tomas","Sol","Juan","Nico","Emi","Maxi","Fede"].map((n,i)=>(
    {id:uid(), name:n, toma:i<4, postre:true, alias:""}
  ));
  const pid = ppl[0].id;
  const it = (name,price,cat)=>({id:uid(),name,price,cat,payer:pid});
  const items = [
    it("Costilla (1 kg)",13000,"comida"), it("Matambre (1,5 kg)",21000,"comida"),
    it("Vacío (0,8 kg)",18400,"comida"), it("Chorizos (6 u)",11800,"comida"),
    it("Tomate",2420,"comida"), it("Lechuga",2479,"comida"), it("Pan",3690,"comida"),
    it("Salame",8297,"comida"), it("Queso",11572,"comida"), it("Chinchulines",11243,"comida"),
    it("Carbón (5 kg)",5000,"extras"),
    it("Fernet",18400,"bebida"), it("Coca (x2)",11380,"bebida"),
  ];
  return {people:ppl, items, rounding:0, planType:"asado", planSplit:true, planDrink:true, planDessert:false, planH:4, planM:3, planN:7, rules:DEFAULT_RULES.slice()};
}
function normalize(s){
  s.people = (s.people||[]).map(p=>({id:p.id||uid(),name:p.name||"",toma:!!p.toma,postre:(p.postre!==false),alias:p.alias||""}));
  s.items = (s.items||[]).map(i=>({
    id:i.id||uid(), name:i.name||"", price:+i.price||0,
    cat:["comida","bebida","extras","postre"].includes(i.cat)?i.cat:"comida", payer:i.payer||""
  }));
  s.rounding = [0,500,1000].includes(s.rounding)?s.rounding:0;
  s.rules = Array.isArray(s.rules)? s.rules.filter(r=>typeof r==="string") : DEFAULT_RULES.slice();
  s.planType = PLAN_TYPES[s.planType]? s.planType : "asado";
  s.planSplit = (s.planSplit!==false);
  s.planDrink = (s.planDrink!==false);
  s.planDessert = !!s.planDessert;
  s.planH = Number.isFinite(+s.planH)? +s.planH : 4;
  s.planM = Number.isFinite(+s.planM)? +s.planM : 3;
  s.planN = Number.isFinite(+s.planN)? +s.planN : 7;
  const validPayers = new Set(s.people.map(p=>p.id));
  s.items.forEach(i=>{ if(i.payer && !validPayers.has(i.payer)) i.payer=""; });
  return s;
}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(state)); }catch(e){} }
function load(){ try{ const r=localStorage.getItem(STORE); return r?JSON.parse(r):null; }catch(e){ return null; } }

// ---- compartir por link (datos en la URL) ----
function toURL(){
  try{
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({p:state.people,i:state.items,r:state.rounding}))));
    return location.origin+location.pathname+"#j="+data;
  }catch(e){ return location.href; }
}
function fromURL(){
  try{
    const m = location.hash.match(/#j=(.+)/); if(!m) return null;
    const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    return {people:o.p||[], items:o.i||[], rounding:o.r||0};
  }catch(e){ return null; }
}

function roundShare(v){ return state.rounding ? Math.round(v/state.rounding)*state.rounding : v; }

function compute(){
  const np = state.people.length;
  const sumCat = c => state.items.filter(i=>i.cat===c).reduce((s,i)=>s+(+i.price||0),0);
  const comida = sumCat("comida"), bebida = sumCat("bebida"), extras = sumCat("extras"), postre = sumCat("postre");
  let drinkers = state.people.filter(p=>p.toma);
  if(drinkers.length===0) drinkers = state.people.slice();
  const dset = new Set(drinkers.map(p=>p.id));
  let eaters = state.people.filter(p=>p.postre);
  if(eaters.length===0) eaters = state.people.slice();
  const eset = new Set(eaters.map(p=>p.id));
  const comidaShare = np ? comida/np : 0;
  const extrasShare = np ? extras/np : 0;
  const bebidaShare = drinkers.length ? bebida/drinkers.length : 0;
  const postreShare = eaters.length ? postre/eaters.length : 0;
  const pp = state.people.map(p=>{
    const toma = dset.has(p.id);
    const come = eset.has(p.id);
    const rawShare = comidaShare + extrasShare + (toma?bebidaShare:0) + (come?postreShare:0);
    const share = roundShare(rawShare);
    const paid = state.items.filter(i=>i.payer===p.id).reduce((s,i)=>s+(+i.price||0),0);
    return {id:p.id,name:p.name||"(sin nombre)",toma,come,alias:p.alias,comidaShare,extrasShare,bebidaShare:toma?bebidaShare:0,postreShare:come?postreShare:0,share,rawShare,paid,balance:paid-share};
  });
  return {comida,bebida,extras,postre,total:comida+bebida+extras+postre,np,nDrinkers:drinkers.length,nEaters:eaters.length,comidaShare,bebidaShare,extrasShare,postreShare,pp};
}

function settle(pp){
  const cr = pp.filter(p=>p.balance>0.5).map(p=>({...p,bal:p.balance})).sort((a,b)=>b.bal-a.bal);
  const db = pp.filter(p=>p.balance<-0.5).map(p=>({...p,bal:-p.balance})).sort((a,b)=>b.bal-a.bal);
  const t=[]; let i=0,j=0;
  while(i<db.length && j<cr.length){
    const pay=Math.min(db[i].bal,cr[j].bal);
    t.push({from:db[i].name,to:cr[j].name,amount:pay,alias:cr[j].alias});
    db[i].bal-=pay; cr[j].bal-=pay;
    if(db[i].bal<0.5)i++; if(cr[j].bal<0.5)j++;
  }
  return t;
}

// ---- PLANIFICAR ----
function isDrinkItem(name){ return /gaseosa|cerveza|fernet|bebida|trago/i.test(name); }
function planRowsFor(type,h,m){
  const t=PLAN_TYPES[type]||PLAN_TYPES.asado;
  let items=t.rows(h,m).slice();
  if(!state.planDrink && type!=="bebidas") items=items.filter(it=>!isDrinkItem(it.name));
  if(state.planDessert && type!=="bebidas") items.push({ic:"🧁",name:"Postre (helado ~1 kg c/4)",qty:Math.round((h+m)/4*10)/10,unit:"kg",step:0.5});
  return items;
}
function planHeadText(){
  const type=state.planType||"asado"; const t=PLAN_TYPES[type]||PLAN_TYPES.asado;
  let h,m;
  if(state.planSplit){ h=Math.max(0,parseInt($("#pl-h").value)||0); m=Math.max(0,parseInt($("#pl-m").value)||0); }
  else { const nn=Math.max(0,parseInt($("#pl-n").value)||0); h=nn/2; m=nn/2; }
  const n=Math.round(h+m);
  const drinkNote=(!state.planDrink && type!=="bebidas")?" · cada uno lleva su bebida":"";
  const ppl=state.planSplit?`${n} personas (${Math.round(h)} 👨 · ${Math.round(m)} 👩)`:`${n} personas`;
  return `${t.note} · ${ppl}${drinkNote}`;
}
function renderPlanList(){
  $("#plan-out").innerHTML = `<p class="hint" style="margin:8px 0 6px">${planHeadText()}</p>`
    + planWork.map((it,idx)=>{
        const right = (it.text!=null)
          ? `<span style="color:var(--muted)">${esc(it.text)}</span>`
          : `<button class="pl-q-dec" data-i="${idx}" style="background:none;color:var(--muted);font-size:19px;line-height:1;padding:0 9px">−</button><b style="font-variant-numeric:tabular-nums;min-width:30px;text-align:right;display:inline-block">${plnum(it.qty)}</b> <span style="color:var(--muted);font-size:12.5px">${it.unit}</span><button class="pl-q-inc" data-i="${idx}" style="background:none;color:var(--accent);font-size:19px;line-height:1;padding:0 9px">+</button>`;
        return `<div class="planrow"><span class="q"><button class="pl-q-x" data-i="${idx}" style="background:none;color:var(--muted);font-size:17px;line-height:1;padding:0 4px 0 0">×</button><span>${it.ic} ${esc(it.name)}</span></span><span class="a" style="display:flex;align-items:center;gap:1px">${right}</span></div>`;
      }).join("")
    + (planWork.length===0?'<div class="empty">Sacaste todos los ítems. Cambiá el tipo o la cantidad de personas para recalcular.</div>':"");
}
function renderPlan(){
  const type=$("#pl-type").value||"asado"; state.planType=type;
  let h,m;
  if(state.planSplit){ h=Math.max(0,parseInt($("#pl-h").value)||0); m=Math.max(0,parseInt($("#pl-m").value)||0); state.planH=h; state.planM=m; }
  else { const nn=Math.max(0,parseInt($("#pl-n").value)||0); state.planN=nn; h=nn/2; m=nn/2; }
  if($("#pl-drink-row")) $("#pl-drink-row").style.display = type==="bebidas" ? "none" : "flex";
  if($("#pl-dessert-row")) $("#pl-dessert-row").style.display = type==="bebidas" ? "none" : "flex";
  planWork = planRowsFor(type,h,m).map(it=>({...it}));
  renderPlanList();
  save();
}
function applySplitUI(){
  const on=state.planSplit;
  $("#pl-split-toggle").textContent=on?"Sí":"No";
  $("#pl-split-toggle").classList.toggle("on",on);
  $("#pl-single").classList.toggle("hidden",on);
  $("#pl-double").classList.toggle("hidden",!on);
}
function renderRules(){
  const box=$("#rlist"); if(!box) return;
  box.innerHTML = state.rules.length ? state.rules.map((r,idx)=>`
    <div class="rrow" data-idx="${idx}">
      <span class="rnum">${idx+1}</span>
      <span class="rtext">${esc(r)}</span>
      <button class="x r-del">×</button>
    </div>`).join("") : '<div class="empty">Todavía no hay reglas. Agregá la primera 👇</div>';
}

// ---- RENDER personas / items ----
function renderPeople(){
  const box=$("#plist");
  if(!state.people.length){ box.innerHTML='<div class="empty">Agregá las personas de la juntada.</div>'; }
  else box.innerHTML = state.people.map(p=>`
    <div class="prow" data-id="${p.id}">
      <div class="row">
        <input class="p-name" value="${esc(p.name)}" placeholder="Nombre" style="flex:1">
        <button class="x p-del">×</button>
      </div>
      <div class="row" style="margin-top:6px">
        <span class="pill ${p.toma?'on':''} p-toma">🍺 toma</span>
        <span class="pill ${p.postre?'on':''} p-postre">🧁 postre</span>
      </div>
      <div class="row" style="margin-top:6px">
        <input class="p-alias" value="${esc(p.alias||'')}" placeholder="alias / CBU para transferencias" style="flex:1">
      </div>
    </div>`).join("");
}
function renderPayerOptions(sel){
  return state.people.map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.name||'(sin nombre)')}</option>`).join("");
}
function catLabel(c){ return c==="bebida"?"🍺 Bebida":c==="extras"?"🧊 Extras":c==="postre"?"🧁 Postre":"🍽️ Comida"; }
function renderItems(){
  const box=$("#ilist");
  if(!state.items.length){ box.innerHTML='<div class="empty">Todavía no cargaste gastos.</div>'; }
  else box.innerHTML = state.items.map(it=>`
    <div class="irow" data-id="${it.id}">
      <div class="row">
        <input class="i-name" value="${esc(it.name)}" style="flex:2">
        <input class="i-price" type="number" inputmode="decimal" value="${it.price}" style="flex:1">
        <button class="x i-del">×</button>
      </div>
      <div class="row" style="margin-top:6px">
        <select class="i-cat" style="flex:1">
          <option value="comida" ${it.cat==='comida'?'selected':''}>🍽️ Comida</option>
          <option value="bebida" ${it.cat==='bebida'?'selected':''}>🍺 Bebida</option>
          <option value="postre" ${it.cat==='postre'?'selected':''}>🧁 Postre</option>
          <option value="extras" ${it.cat==='extras'?'selected':''}>🧊 Extras</option>
        </select>
        <div style="flex:1"><div class="lbl">Pagó</div><select class="i-payer"><option value="" ${!it.payer?'selected':''}>¿Quién pagó?</option>${renderPayerOptions(it.payer)}</select></div>
      </div>
    </div>`).join("");
  $("#ni-payer").innerHTML = '<option value="">¿Quién pagó?</option>' + renderPayerOptions("");
}

function renderResult(){
  const c=compute();
  $("#total").textContent=money(c.total);
  $("#sub-com").textContent="🍽️ Comida "+money(c.comida);
  $("#sub-beb").textContent="🍺 Bebida "+money(c.bebida);
  $("#sub-ext").textContent="🧊 Extras "+money(c.extras);
  $("#sub-pos").textContent="🧁 Postre "+money(c.postre);
  $("#food-per").textContent=money(c.comidaShare);
  $("#food-det").textContent= c.np ? money(c.comida)+" ÷ "+c.np : "entre todos";
  $("#drink-per").textContent=money(c.bebidaShare);
  $("#drink-det").textContent= c.bebida ? money(c.bebida)+" ÷ "+c.nDrinkers+" que toman" : "los que toman";
  $("#postre-per").textContent=money(c.postreShare);
  $("#postre-det").textContent= c.postre ? money(c.postre)+" ÷ "+c.nEaters+" que comen" : "los que comen";
  $("#postre-card").classList.toggle("hidden", c.postre<=0);
  $("#extra-per").textContent=money(c.extrasShare);
  $("#extra-card").classList.toggle("hidden", c.extras<=0);

  const anyPaid = c.pp.some(p=>p.paid>0);
  $("#perperson").innerHTML = c.pp.length ? c.pp.map(p=>`
    <div class="pp">
      <div><span class="nm">${esc(p.name)}</span>
        <div class="meta">🍽️ ${money(p.comidaShare)}${p.extrasShare>0?` + 🧊 ${money(p.extrasShare)}`:''}${p.bebidaShare>0?` + 🍺 ${money(p.bebidaShare)}`:''}${p.postreShare>0?` + 🧁 ${money(p.postreShare)}`:''}${anyPaid?` · puso ${money(p.paid)}`:''}</div></div>
      <span class="amt">${money(p.share)}</span>
    </div>`).join("") : '<div class="empty">Agregá personas y gastos para ver el reparto.</div>';

  $("#round-note").innerHTML = state.rounding ? `<div class="note">Montos redondeados a $${state.rounding.toLocaleString("es-AR")} — puede sobrar o faltar algún peso al juntar el efectivo.</div>` : "";

  const t = anyPaid ? settle(c.pp) : [];
  $("#settle").innerHTML = t.length ? `
    <div class="settle"><h3>🔁 Cómo saldar</h3>${t.map(x=>`
      <div class="t">→ <b>${esc(x.from)}</b> le transfiere <b>${money(x.amount)}</b> a <b>${esc(x.to)}</b>
      ${x.alias?`<div class="alias">alias: ${esc(x.alias)}</div>`:''}</div>`).join("")}</div>`
    : ((c.pp.length && c.total>0 && !anyPaid) ? `<div class="settle" style="background:#fff;border-color:var(--line)"><h3 style="color:var(--muted)">🔁 Cómo saldar</h3><div class="t" style="color:var(--muted)">Asigná <b>quién pagó</b> cada gasto (en el desplegable “¿Quién pagó?”) y acá va a aparecer quién le transfiere a quién para quedar a mano.</div></div>` : "");
  save();
}

function renderAll(){ renderPeople(); renderItems(); renderResult(); renderPlan(); renderRules(); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ---- TABS ----
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));
  t.classList.add("on");
  const tab=t.dataset.tab;
  $("#view-plan").classList.toggle("hidden", tab!=="plan");
  $("#view-div").classList.toggle("hidden", tab!=="div");
  $("#view-reglas").classList.toggle("hidden", tab!=="reglas");
});

// ---- PLANIFICAR events ----
$("#pl-type").addEventListener("change",renderPlan);
$("#pl-skip").onclick=()=>$("#tab-div-btn").click();
$("#pl-why").onclick=()=>{ const nt=$("#pl-why-note"); nt.style.display = nt.style.display==="none"?"block":"none"; };
$("#pl-drink-toggle").onclick=()=>{ state.planDrink=!state.planDrink; $("#pl-drink-toggle").textContent=state.planDrink?"Sí":"No"; $("#pl-drink-toggle").classList.toggle("on",state.planDrink); renderPlan(); };
$("#pl-dessert-toggle").onclick=()=>{ state.planDessert=!state.planDessert; $("#pl-dessert-toggle").textContent=state.planDessert?"Sí":"No"; $("#pl-dessert-toggle").classList.toggle("on",state.planDessert); renderPlan(); };
$("#plan-out").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  const i=+b.dataset.i; if(isNaN(i)||!planWork[i]) return;
  if(b.classList.contains("pl-q-x")){ planWork.splice(i,1); renderPlanList(); return; }
  const it=planWork[i]; if(it.qty==null) return;
  const step=it.step||1;
  if(b.classList.contains("pl-q-dec")) it.qty=Math.max(0,Math.round((it.qty-step)*100)/100);
  else if(b.classList.contains("pl-q-inc")) it.qty=Math.round((it.qty+step)*100)/100;
  renderPlanList();
});
$("#pl-h").addEventListener("input",renderPlan);
$("#pl-m").addEventListener("input",renderPlan);
$("#pl-n").addEventListener("input",renderPlan);
$("#pl-split-toggle").onclick=()=>{ state.planSplit=!state.planSplit; applySplitUI(); renderPlan(); };
document.querySelectorAll(".pl-dec").forEach(b=>b.onclick=()=>{ const inp=$(b.dataset.g==="h"?"#pl-h":"#pl-m"); inp.value=Math.max(0,(parseInt(inp.value)||0)-1); renderPlan(); });
document.querySelectorAll(".pl-inc").forEach(b=>b.onclick=()=>{ const inp=$(b.dataset.g==="h"?"#pl-h":"#pl-m"); inp.value=(parseInt(inp.value)||0)+1; renderPlan(); });
$("#pl-n-dec").onclick=()=>{ $("#pl-n").value=Math.max(0,(parseInt($("#pl-n").value)||0)-1); renderPlan(); };
$("#pl-n-inc").onclick=()=>{ $("#pl-n").value=(parseInt($("#pl-n").value)||0)+1; renderPlan(); };
$("#pl-load").onclick=()=>{
  let n = state.planSplit ? (Math.max(0,parseInt($("#pl-h").value)||0)+Math.max(0,parseInt($("#pl-m").value)||0)) : Math.max(0,parseInt($("#pl-n").value)||0);
  if(!n) return;
  if(state.people.length && !confirm("Esto reemplaza las personas actuales por "+n+" nuevas. ¿Seguir?")) return;
  state.people = Array.from({length:n},(_,i)=>({id:uid(),name:"Persona "+(i+1),toma:true,postre:true,alias:""}));
  state.items.forEach(it=>it.payer="");
  $("#tab-div-btn").click();
  renderAll();
};
function planItemCat(it){
  if(isDrinkItem(it.name)) return "bebida";
  if(/postre/i.test(it.name)) return "postre";
  if(/carb[oó]n|hielo/i.test(it.name)) return "extras";
  return "comida";
}
$("#pl-load-items").onclick=()=>{
  const loadable = planWork.filter(it=>it.text==null);
  if(!loadable.length) return;
  if(state.items.length && !confirm("Esto reemplaza los gastos actuales con los ítems del planificador (sin precios). ¿Seguir?")) return;
  state.items = loadable.map(it=>({id:uid(), name:it.ic+" "+it.name, price:0, cat:planItemCat(it), payer:""}));
  $("#tab-div-btn").click();
  renderAll();
};
// ---- Copiar lista del planificador ----
function planContext(){
  const type=$("#pl-type").value||"asado";
  let h,m;
  if(state.planSplit){ h=Math.max(0,parseInt($("#pl-h").value)||0); m=Math.max(0,parseInt($("#pl-m").value)||0); }
  else { const nn=Math.max(0,parseInt($("#pl-n").value)||0); h=nn/2; m=nn/2; }
  return {type,h,m,n:Math.round(h+m),t:PLAN_TYPES[type]||PLAN_TYPES.asado};
}
function planTypeLabel(type){ const o=[...$("#pl-type").options].find(x=>x.value===type); return o?o.text:type; }
function buildPlanList(){
  const {type,h,m,n}=planContext();
  let s="🛒 *Lista para el súper* — "+planTypeLabel(type)+"\n"+n+" personas"+(state.planSplit?" ("+Math.round(h)+" 👨 · "+Math.round(m)+" 👩)":"")+"\n\n";
  planWork.forEach(it=>{ s+="• "+it.ic+" "+it.name+": "+(it.text!=null?it.text:plnum(it.qty)+" "+it.unit)+"\n"; });
  if(!state.planDrink && type!=="bebidas") s+="\n(la bebida la lleva cada uno)\n";
  return s;
}
$("#pl-copy").onclick=async()=>{
  const txt=buildPlanList(); const btn=$("#pl-copy");
  try{ await navigator.clipboard.writeText(txt); }catch(e){ try{document.execCommand("copy");}catch(_){ prompt("Copiá la lista:",txt); return; } }
  btn.textContent="📋 ¡Lista copiada!"; setTimeout(()=>btn.textContent="📋 Copiar lista para el súper",1700);
};

// ---- REGLAS events ----
$("#nr-add").onclick=()=>{ const v=$("#nr-text").value.trim(); if(!v)return; state.rules.push(v); $("#nr-text").value=""; renderRules(); save(); };
$("#nr-text").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); $("#nr-add").click(); } });
$("#rlist").addEventListener("click",e=>{ if(e.target.classList.contains("r-del")){ const row=e.target.closest(".rrow"); state.rules.splice(+row.dataset.idx,1); renderRules(); save(); } });

// ---- PERSONAS events ----
$("#np-add").onclick=()=>{ const n=$("#np-name").value.trim(); state.people.push({id:uid(),name:n||"Persona "+(state.people.length+1),toma:true,postre:true,alias:""}); $("#np-name").value=""; renderAll(); };
$("#np-name").addEventListener("keydown",e=>{ if(e.key==="Enter")$("#np-add").click(); });
$("#plist").addEventListener("input",e=>{
  const row=e.target.closest(".prow"); if(!row)return; const p=state.people.find(x=>x.id===row.dataset.id);
  if(e.target.classList.contains("p-name")){ p.name=e.target.value; renderItems(); renderResult(); return; }
  if(e.target.classList.contains("p-alias"))p.alias=e.target.value;
  renderResult();
});
$("#plist").addEventListener("click",e=>{
  const row=e.target.closest(".prow"); if(!row)return; const id=row.dataset.id;
  if(e.target.classList.contains("p-toma")){ const p=state.people.find(x=>x.id===id); p.toma=!p.toma; renderAll(); }
  if(e.target.classList.contains("p-postre")){ const p=state.people.find(x=>x.id===id); p.postre=!p.postre; renderAll(); }
  if(e.target.classList.contains("p-del")){ state.people=state.people.filter(x=>x.id!==id);
    state.items.forEach(i=>{ if(i.payer===id)i.payer=""; }); renderAll(); }
});

// ---- GASTOS events ----
function addItem(){
  const name=$("#ni-name").value.trim(); const price=parseFloat($("#ni-price").value);
  if(!name||isNaN(price)){ $("#ni-name").focus(); return; }
  state.items.push({id:uid(),name,price,cat:$("#ni-cat").value,payer:$("#ni-payer").value||""});
  $("#ni-name").value=""; $("#ni-price").value=""; renderAll(); $("#ni-name").focus();
}
$("#ni-add").onclick=addItem;
$("#ni-price").addEventListener("keydown",e=>{ if(e.key==="Enter")addItem(); });
$("#ilist").addEventListener("input",e=>{
  const row=e.target.closest(".irow"); if(!row)return; const it=state.items.find(x=>x.id===row.dataset.id);
  if(e.target.classList.contains("i-name"))it.name=e.target.value;
  if(e.target.classList.contains("i-price"))it.price=parseFloat(e.target.value)||0;
  renderResult();
});
$("#ilist").addEventListener("change",e=>{
  const row=e.target.closest(".irow"); if(!row)return; const it=state.items.find(x=>x.id===row.dataset.id);
  if(e.target.classList.contains("i-cat"))it.cat=e.target.value;
  if(e.target.classList.contains("i-payer"))it.payer=e.target.value;
  renderResult();
});
$("#ilist").addEventListener("click",e=>{
  if(e.target.classList.contains("i-del")){ const row=e.target.closest(".irow");
    state.items=state.items.filter(x=>x.id!==row.dataset.id); renderAll(); }
});

// ---- REDONDEO ----
$("#round-seg").addEventListener("click",e=>{
  if(e.target.tagName!=="BUTTON")return;
  state.rounding=parseInt(e.target.dataset.r)||0;
  document.querySelectorAll("#round-seg button").forEach(b=>b.classList.toggle("on",b===e.target));
  renderResult();
});

// ---- WhatsApp ----
function waText(){
  const c=compute(); const anyPaid=c.pp.some(p=>p.paid>0); const t=anyPaid?settle(c.pp):[];
  let s="🍖 *La Juntada* — "+new Date().toLocaleDateString("es-AR")+"\n_Cuentas claras conservan la amistad_\n\n";
  s+="*Total:* "+money(c.total)+"\n";
  s+="🍽️ Comida: "+money(c.comida)+" ÷ "+c.np+" = "+money(c.comidaShare)+" c/u\n";
  if(c.bebida>0) s+="🍺 Bebida: "+money(c.bebida)+" ÷ "+c.nDrinkers+" = "+money(c.bebidaShare)+" c/u\n";
  if(c.postre>0) s+="🧁 Postre: "+money(c.postre)+" ÷ "+c.nEaters+" = "+money(c.postreShare)+" c/u\n";
  if(c.extras>0) s+="🧊 Extras: "+money(c.extras)+" ÷ "+c.np+" = "+money(c.extrasShare)+" c/u\n";
  s+="\n*Por persona:*\n";
  c.pp.forEach(p=>{ s+="• "+p.name+": "+money(p.share)+(p.toma?"":" (no toma)")+(anyPaid?"  — puso "+money(p.paid):"")+"\n"; });
  if(state.rounding) s+="_(redondeado a $"+state.rounding.toLocaleString("es-AR")+")_\n";
  if(t.length){ s+="\n*Cómo saldar:*\n"; t.forEach(x=>{ s+="→ "+x.from+" le transfiere "+money(x.amount)+" a "+x.to+(x.alias?" (alias: "+x.alias+")":"")+"\n"; }); }
  return s;
}
$("#btn-wa").onclick=()=>{ $("#wa-text").value=waText(); $("#dlg-wa").showModal(); };
$("#wa-close").onclick=()=>$("#dlg-wa").close();
$("#wa-copy").onclick=async()=>{
  const ta=$("#wa-text"); ta.select();
  try{ await navigator.clipboard.writeText(ta.value); }catch(e){ try{document.execCommand("copy");}catch(_){} }
  $("#wa-copy").textContent="¡Copiado!"; setTimeout(()=>$("#wa-copy").textContent="Copiar texto",1500);
};

// ---- Compartir link ----
$("#btn-share").onclick=async()=>{
  const url=toURL();
  const btn=$("#btn-share");
  try{
    if(navigator.share){ await navigator.share({title:"La Juntada", text:"Mirá la cuenta de la juntada", url}); return; }
    await navigator.clipboard.writeText(url);
    btn.textContent="🔗 ¡Link copiado!";
  }catch(e){ try{ await navigator.clipboard.writeText(url); btn.textContent="🔗 ¡Link copiado!"; }catch(_){ prompt("Copiá este link:",url); } }
  setTimeout(()=>btn.textContent="🔗 Compartir link",1800);
};

// ---- Historial ----
function getHist(){ try{ return JSON.parse(localStorage.getItem(HIST))||[]; }catch(e){ return []; } }
function setHist(h){ try{ localStorage.setItem(HIST,JSON.stringify(h)); }catch(e){} }
function loadJuntada(id, skipConfirm){
  const h=getHist(); const j=h.find(x=>x.id===id); if(!j) return;
  if(!skipConfirm && (state.people.length||state.items.length) && !confirm("Abrir \""+j.name+"\" reemplaza lo que tenés ahora. ¿Seguir?")) return;
  const keepRules=state.rules;
  state=normalize(JSON.parse(JSON.stringify(j.snap)));
  state.rules=keepRules;
  document.querySelectorAll("#round-seg button").forEach(b=>b.classList.toggle("on",(parseInt(b.dataset.r)||0)===state.rounding));
  $("#dlg-hist").close(); $("#welcome").style.display="none"; $("#tab-div-btn").click(); renderAll();
}
$("#btn-save").onclick=()=>{
  const fecha=new Date().toLocaleDateString("es-AR");
  const name=prompt("Nombre para esta juntada (si lo dejás vacío, se guarda con la fecha):",""); if(name===null) return;
  const finalName=name.trim()||fecha;
  const c=compute();
  const h=getHist();
  h.unshift({id:uid(),name:finalName,date:fecha,total:c.total,np:state.people.length,snap:JSON.parse(JSON.stringify({people:state.people,items:state.items,rounding:state.rounding}))});
  setHist(h); renderWelcomeHist();
  $("#btn-save").textContent="✓ Guardada"; setTimeout(()=>$("#btn-save").textContent="💾 Guardar juntada",1500);
};
function renderHist(){
  const h=getHist();
  $("#hist-list").innerHTML = h.length ? h.map(j=>`
    <div class="histitem" data-id="${j.id}">
      <div class="hi-info">${esc(j.name)}<small>${j.date} · ${j.np} personas · ${money(j.total)}</small></div>
      <div class="hi-btns"><button class="add hi-load">Abrir</button><button class="mini hi-del">🗑</button></div>
    </div>`).join("") : '<div class="empty">Todavía no guardaste ninguna juntada.</div>';
}
$("#btn-hist").onclick=()=>{ renderHist(); $("#dlg-hist").showModal(); };
$("#hist-close").onclick=()=>$("#dlg-hist").close();
$("#hist-list").addEventListener("click",e=>{
  const row=e.target.closest(".histitem"); if(!row)return; const id=row.dataset.id; const h=getHist();
  if(e.target.classList.contains("hi-load")){ loadJuntada(id); return; }
  if(e.target.classList.contains("hi-del")){
    if(!confirm("¿Borrar esta juntada del historial?")) return;
    setHist(h.filter(x=>x.id!==id)); renderHist();
  }
});

// ---- Reset ----
$("#btn-reset").onclick=()=>{ if(confirm("¿Vaciar todo y empezar una juntada nueva?")){ state={people:[],items:[],rounding:0,planType:state.planType,planSplit:state.planSplit,planDrink:state.planDrink,planDessert:state.planDessert,planH:state.planH,planM:state.planM,planN:state.planN,rules:state.rules}; history.replaceState(null,"",location.pathname); document.querySelectorAll("#round-seg button").forEach(b=>b.classList.toggle("on",b.dataset.r==="0")); save(); renderAll(); } };

// ---- Bienvenida ----
$("#welcome-start").onclick=()=>{ $("#welcome").style.display="none"; $("#tab-plan-btn").click(); };
$("#welcome-hist").addEventListener("click",e=>{ const row=e.target.closest(".wh-item"); if(row) loadJuntada(row.dataset.id,true); });
function renderWelcomeHist(){
  const h=getHist(); const box=$("#welcome-hist"); if(!box) return;
  if(!h.length){ box.innerHTML='<div style="font-size:12.5px;color:var(--muted);text-align:center;margin-top:6px">Acá van a aparecer tus juntadas guardadas.</div>'; return; }
  box.innerHTML='<div style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Juntadas guardadas</div>'
    + h.slice(0,4).map(j=>`<div class="wh-item" data-id="${j.id}" style="display:flex;justify-content:space-between;align-items:center;border:1px solid var(--line);border-radius:11px;padding:11px 13px;margin-bottom:8px;cursor:pointer;background:#fff">
        <div><div style="font-size:14px;font-weight:600">${esc(j.name)}</div><div style="font-size:12px;color:var(--muted)">${j.date} · ${j.np} personas · ${money(j.total)}</div></div>
        <span style="color:var(--muted);font-size:18px">›</span>
      </div>`).join("")
    + (h.length>4?`<div style="font-size:12px;color:var(--muted);text-align:center;margin-top:2px">y ${h.length-4} más en 📋 Historial</div>`:"");
}

// ---- init ----
$("#date").textContent=new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
$("#pl-type").value = state.planType||"asado";
$("#pl-h").value = state.planH;
$("#pl-m").value = state.planM;
$("#pl-n").value = state.planN;
$("#pl-drink-toggle").classList.toggle("on",state.planDrink);
$("#pl-drink-toggle").textContent=state.planDrink?"Sí":"No";
$("#pl-dessert-toggle").classList.toggle("on",state.planDessert);
$("#pl-dessert-toggle").textContent=state.planDessert?"Sí":"No";
applySplitUI();
document.querySelectorAll("#round-seg button").forEach(b=>b.classList.toggle("on",(parseInt(b.dataset.r)||0)===state.rounding));
renderWelcomeHist();
renderAll();
