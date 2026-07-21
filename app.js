const state={all:[],filtered:[],selected:new Map(),mobileDay:'Lunes'};
const $=id=>document.getElementById(id);
const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const startMin=8*60,endMin=23*60,step=30;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const scheduleKey=b=>`${b.dia}|${b.inicio}|${b.fin}`;
const scheduleLabel=b=>`${b.dia.slice(0,2)} ${b.inicio}–${b.fin}`;

async function init(){
  const data=await fetch('data/horarios.json').then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
  state.all=data.secciones;
  populateFilters();
  restoreSelection();
  applyFilters();
  renderAll();
  ['careerSelect','shiftSelect','levelSelect','scheduleSelect'].forEach(id=>$(id).addEventListener('change',()=>{cascadeFilters(id);applyFilters();renderCourses()}));
  ['courseSearchInput','teacherSearchInput'].forEach(id=>$(id).addEventListener('input',()=>{applyFilters();renderCourses()}));
  $('clearBtn').addEventListener('click',()=>{state.selected.clear();saveSelection();renderAll()});
  $('shareBtn').addEventListener('click',copyShareLink);
  $('pdfBtn').addEventListener('click',exportPdf);
  renderMobileDayTabs();
}
function valuesFor(key,predicate=()=>true){return [...new Set(state.all.filter(predicate).map(x=>x[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es',{numeric:true}))}
function setOptions(id,values,label,current=''){
  const el=$(id);
  el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');
}
function populateFilters(){
  setOptions('careerSelect',valuesFor('carrera'),'Todas');
  updateShiftOptions();
  cascadeFilters();
}
function updateShiftOptions(){
  const current=$('shiftSelect').value;
  const career=$('careerSelect').value;
  const allShifts=valuesFor('jornada');
  const available=new Set(valuesFor('jornada',x=>!career||x.carrera===career));
  const el=$('shiftSelect');
  el.innerHTML='<option value="">Todas</option>'+allShifts.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''} ${available.has(v)?'':'disabled'}>${esc(v)}${available.has(v)?'':' — sin ramos'}</option>`).join('');
  if(current&&!available.has(current))el.value='';
}
function basePredicate(x){
  const c=$('careerSelect').value,j=$('shiftSelect').value,n=$('levelSelect').value;
  return(!c||x.carrera===c)&&(!j||x.jornada===j)&&(!n||x.nivel===n);
}
function cascadeFilters(changed){
  if(changed==='careerSelect')updateShiftOptions();
  const levelCurrent=changed==='careerSelect'||changed==='shiftSelect'?'':$('levelSelect').value;
  setOptions('levelSelect',valuesFor('nivel',x=>(!$('careerSelect').value||x.carrera===$('careerSelect').value)&&(!$('shiftSelect').value||x.jornada===$('shiftSelect').value)),'Todos',levelCurrent);
  const selectedSchedule=$('scheduleSelect').value;
  const blocks=new Map();
  state.all.filter(basePredicate).forEach(x=>x.bloques.forEach(b=>blocks.set(scheduleKey(b),b)));
  const sorted=[...blocks.values()].sort((a,b)=>days.indexOf(a.dia)-days.indexOf(b.dia)||toMin(a.inicio)-toMin(b.inicio)||toMin(a.fin)-toMin(b.fin));
  const el=$('scheduleSelect');
  el.innerHTML='<option value="">Cualquier horario</option>'+sorted.map(b=>`<option value="${esc(scheduleKey(b))}" ${scheduleKey(b)===selectedSchedule?'selected':''}>${esc(scheduleLabel(b))}</option>`).join('');
  if(selectedSchedule&&!blocks.has(selectedSchedule))el.value='';
}
function applyFilters(){
  const courseQuery=normalize($('courseSearchInput').value);
  const teacherQuery=normalize($('teacherSearchInput').value);
  const schedule=$('scheduleSelect').value;
  state.filtered=state.all.filter(x=>basePredicate(x)
    &&(!schedule||x.bloques.some(b=>scheduleKey(b)===schedule))
    &&(!courseQuery||normalize(`${x.asignatura} ${x.sigla}`).includes(courseQuery))
    &&(!teacherQuery||normalize(x.docentes.join(' ')).includes(teacherQuery)));
}
function groupCourses(){
  const groups=new Map();
  for(const s of state.filtered){
    // La sigla forma parte de la identidad del ramo. Dos ramos con el mismo
    // nombre, pero con siglas distintas, se mantienen separados.
    const key=`${s.carrera}|${s.jornada}|${s.nivel}|${s.sigla}`;
    if(!groups.has(key))groups.set(key,{...s,sections:[]});
    groups.get(key).sections.push(s);
  }
  const result=[...groups.values()];
  const siglasPorNombre=new Map();
  for(const course of result){
    const nameKey=`${course.carrera}|${course.jornada}|${course.nivel}|${normalize(course.asignatura)}`;
    if(!siglasPorNombre.has(nameKey))siglasPorNombre.set(nameKey,new Set());
    siglasPorNombre.get(nameKey).add(course.sigla);
  }
  for(const course of result){
    const nameKey=`${course.carrera}|${course.jornada}|${course.nivel}|${normalize(course.asignatura)}`;
    course.sameNameDifferentCode=siglasPorNombre.get(nameKey).size>1;
  }
  return result.sort((a,b)=>a.asignatura.localeCompare(b.asignatura,'es')||a.sigla.localeCompare(b.sigla,'es')).slice(0,180);
}
function renderCourses(){
  const groups=groupCourses();
  $('resultCount').textContent=state.filtered.length===1?'1 sección':`${state.filtered.length} secciones`;
  $('courseList').innerHTML=groups.length?'':'<p class="section-meta">No se encontraron resultados.</p>';
  groups.forEach(c=>{
    const node=$('courseTemplate').content.cloneNode(true);
    node.querySelector('.course-name').textContent=c.asignatura;
    node.querySelector('.course-code').textContent=`Sigla ${c.sigla}${c.sameNameDifferentCode?' · nombre compartido con otra sigla':''}`;
    node.querySelector('.course-level').textContent=`Nivel ${c.nivel}`;
    const box=node.querySelector('.section-options');
    c.sections.sort((a,b)=>a.seccion.localeCompare(b.seccion,'es',{numeric:true})).forEach(s=>{
      const conflict=hasConflictWithSelected(s);
      const btn=document.createElement('button');
      btn.className=`section-btn ${state.selected.has(s.id)?'selected':''} ${conflict&&!state.selected.has(s.id)?'conflict':''}`;
      btn.innerHTML=`<div class="section-main"><span>${esc(s.seccion)}</span><span>${esc(s.modalidad||'')}</span></div><div class="section-meta">${esc(scheduleText(s))}<br>${esc(s.docentes.join(' / '))}</div>`;
      btn.onclick=()=>toggleSection(s);
      box.appendChild(btn);
    });
    $('courseList').appendChild(node);
  });
}
function scheduleText(s){return s.bloques.map(scheduleLabel).join(' · ')}
function blocksOverlap(a,b){return a.dia===b.dia&&toMin(a.inicio)<toMin(b.fin)&&toMin(b.inicio)<toMin(a.fin)}
function hasConflictWithSelected(section){for(const other of state.selected.values()){if(other.id===section.id)continue;if(section.bloques.some(a=>other.bloques.some(b=>blocksOverlap(a,b))))return true}return false}
function toggleSection(s){
  if(state.selected.has(s.id))state.selected.delete(s.id);else{
    for(const [id,x] of state.selected)if(x.sigla===s.sigla)state.selected.delete(id);
    state.selected.set(s.id,s);
  }
  saveSelection();renderAll();
}
function conflicts(){const arr=[...state.selected.values()],out=[];for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++)for(const a of arr[i].bloques)for(const b of arr[j].bloques)if(blocksOverlap(a,b))out.push([arr[i],arr[j],a.dia]);return out}
function renderAlerts(){const c=conflicts();$('alerts').innerHTML=c.length?`<div class="alert error">Hay ${c.length} choque${c.length>1?'s':''} de horario. Revisa las secciones marcadas en rojo.</div>`:state.selected.size?'<div class="alert info">No hay choques entre las secciones elegidas.</div>':''}
function renderCalendar(){
  const cal=$('calendar');
  cal.innerHTML='<div class="cal-head"></div>'+days.map(d=>`<div class="cal-head">${d}</div>`).join('');
  const rows=(endMin-startMin)/step;
  for(let r=0;r<rows;r++){
    const mins=startMin+r*step;
    cal.insertAdjacentHTML('beforeend',`<div class="time-cell" style="grid-row:${r+2}">${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}</div>`);
    days.forEach((_,i)=>cal.insertAdjacentHTML('beforeend',`<div class="grid-cell" style="grid-column:${i+2};grid-row:${r+2}"></div>`));
  }
  const conflictIds=new Set(conflicts().flatMap(x=>[x[0].id,x[1].id]));
  for(const s of state.selected.values())for(const b of s.bloques){
    const di=days.indexOf(b.dia);if(di<0)continue;
    const rowStart=Math.max(0,Math.floor((toMin(b.inicio)-startMin)/step));
    const rowEnd=Math.max(rowStart+1,Math.ceil((toMin(b.fin)-startMin)/step));
    const el=document.createElement('div');
    el.className=`event ${conflictIds.has(s.id)?'conflict':''}`;
    el.style.gridColumn=di+2;el.style.gridRow=`${rowStart+2} / ${rowEnd+2}`;
    el.title=`${s.asignatura} · ${s.seccion}`;
    el.innerHTML=`<strong>${esc(s.asignatura)}</strong><span>${esc(s.seccion)}</span><br>${b.inicio}–${b.fin}`;
    cal.appendChild(el);
  }
}
function renderSelected(){
  const box=$('selectedList'),arr=[...state.selected.values()];
  $('selectedCount').textContent=arr.length===1?'1 sección':`${arr.length} secciones`;
  if(!arr.length){box.className='selected-list empty';box.textContent='Todavía no has agregado secciones.';return}
  box.className='selected-list';
  box.innerHTML=arr.map(s=>`<div class="selected-item"><div><strong>${esc(s.asignatura)}</strong><small>${esc(s.seccion)} · ${esc(scheduleText(s))} · ${esc(s.docentes.join(' / '))}</small></div><button class="remove-btn" data-id="${esc(s.id)}">Quitar</button></div>`).join('');
  box.querySelectorAll('.remove-btn').forEach(b=>b.onclick=()=>{state.selected.delete(b.dataset.id);saveSelection();renderAll()});
}
function renderStats(){
  const arr=[...state.selected.values()],usedDays=new Set(arr.flatMap(s=>s.bloques.map(b=>b.dia)));
  $('stats').innerHTML=`<div class="stat"><strong>${arr.length}</strong><span>Cantidad de secciones</span></div><div class="stat"><strong>${usedDays.size}</strong><span>Días con clases</span></div>`;
}
function renderAll(){renderCourses();renderAlerts();renderStats();renderCalendar();renderSelected();renderMobileDayView()}

function renderMobileDayTabs(){
  const box=$('mobileDayTabs');
  if(!box)return;
  box.innerHTML=days.map(d=>`<button class="day-tab ${state.mobileDay===d?'active':''}" data-day="${esc(d)}">${esc(d.slice(0,3))}</button>`).join('');
  box.querySelectorAll('.day-tab').forEach(btn=>btn.onclick=()=>{
    state.mobileDay=btn.dataset.day;
    renderMobileDayTabs();
    renderMobileDayView();
  });
}
function renderMobileDayView(){
  const box=$('mobileDayView');
  if(!box)return;
  const conflictIds=new Set(conflicts().flatMap(x=>[x[0].id,x[1].id]));
  const items=[];
  for(const s of state.selected.values())for(const b of s.bloques)if(b.dia===state.mobileDay)items.push({s,b});
  items.sort((a,b)=>toMin(a.b.inicio)-toMin(b.b.inicio));
  if(!items.length){box.innerHTML=`<div class="mobile-empty">No tienes clases el ${esc(state.mobileDay.toLowerCase())}.</div>`;return}
  box.innerHTML=items.map(({s,b})=>`<article class="mobile-event ${conflictIds.has(s.id)?'conflict':''}"><div class="mobile-event-time">${esc(b.inicio)}<br>${esc(b.fin)}</div><div class="mobile-event-body"><strong>${esc(s.asignatura)}</strong><span>${esc(s.seccion)} · ${esc(s.docentes.join(' / '))}</span></div></article>`).join('');
}
function printCell(section,block){
  if(!section)return '';
  return `<strong>${esc(section.asignatura)}</strong><br><span>${esc(section.seccion)}</span><br><small>${esc(section.docentes.join(' / '))}</small>`;
}
function exportPdf(){
  if(!state.selected.size){alert('Agrega al menos una sección antes de exportar.');return}
  const selected=[...state.selected.values()];
  const careers=[...new Set(selected.map(s=>s.carrera))];
  const shifts=[...new Set(selected.map(s=>s.jornada))];
  const allBlocks=selected.flatMap(s=>s.bloques.map(b=>({s,b}))).sort((a,b)=>toMin(a.b.inicio)-toMin(b.b.inicio));
  const ranges=[...new Map(allBlocks.map(x=>[`${x.b.inicio}|${x.b.fin}`,{inicio:x.b.inicio,fin:x.b.fin}])).values()].sort((a,b)=>toMin(a.inicio)-toMin(b.inicio));
  const rows=ranges.map(r=>{
    const cells=days.map(day=>{
      const matches=allBlocks.filter(x=>x.b.dia===day&&x.b.inicio===r.inicio&&x.b.fin===r.fin);
      return `<td>${matches.map(x=>printCell(x.s,x.b)).join('<hr>')}</td>`;
    }).join('');
    return `<tr><th>${esc(r.inicio)}<br>A<br>${esc(r.fin)}</th>${cells}</tr>`;
  }).join('');
  const now=new Date();
  const date=now.toLocaleDateString('es-CL');
  const win=window.open('','_blank');
  if(!win){alert('El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para este sitio.');return}
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Horario San Joaquín</title><style>
    @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:10px}.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}.brand{font-size:30px;font-weight:900;letter-spacing:-1px}.brand b{color:#d9a900}.meta{text-align:right;font-family:monospace;font-size:11px}.site{font-family:monospace;font-weight:700;font-size:12px;line-height:1.4}.title{text-align:center;font-size:18px;font-weight:900;margin:8px 0}.student{font-family:monospace;font-size:11px;margin:8px auto 12px;max-width:900px;line-height:1.5}.student span{display:inline-block;min-width:95px;font-weight:700}.subtitle{text-align:center;font-family:monospace;font-size:14px;font-weight:700;margin:8px 0}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #111;padding:5px;text-align:center;vertical-align:middle;overflow-wrap:anywhere}thead th{font-size:11px;background:#f5f5f5}tbody th{width:72px;font-family:monospace;font-weight:400}td{height:55px;font-size:9px;line-height:1.25}td strong{font-size:9px}td span,td small{font-family:monospace;font-size:8px}td hr{border:0;border-top:1px dashed #999;margin:4px 0}.note{margin-top:7px;font-size:8px;color:#555;text-align:right}@media print{button{display:none}}
  </style></head><body><div class="head"><div><div class="brand"><b>DUOC</b> HORARIO</div><div class="site">SEDE: SAN JOAQUÍN<br>N° SEDE: 16</div></div><div class="meta">Planificador de horario<br>Fecha emisión ${esc(date)}</div></div><div class="title">HORARIO ACADÉMICO 2.º Sem. 2026</div><div class="student"><div><span>Carrera:</span>${esc(careers.join(' / '))}</div><div><span>Jornada:</span>${esc(shifts.join(' / '))}</div><div><span>Secciones:</span>${selected.length}</div></div><div class="subtitle">Horario de clases</div><table><thead><tr><th>Módulo<br>Horario</th>${days.map(d=>`<th>${esc(d)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><div class="note">Documento generado por el armador de horario. No corresponde a un comprobante oficial de Duoc UC.</div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
  win.document.close();
}
function saveSelection(){localStorage.setItem('horario-duoc-selection-v2',JSON.stringify([...state.selected.keys()]));history.replaceState(null,'',location.pathname)}
function restoreSelection(){
  const params=new URLSearchParams(location.search);
  const ids=params.get('s')?.split(',').map(decodeURIComponent)||JSON.parse(localStorage.getItem('horario-duoc-selection-v2')||'[]');
  const byId=new Map(state.all.map(x=>[x.id,x]));ids.forEach(id=>{if(byId.has(id))state.selected.set(id,byId.get(id))});
}
async function copyShareLink(){
  const ids=[...state.selected.keys()].map(encodeURIComponent).join(',');
  const url=`${location.origin}${location.pathname}${ids?`?s=${ids}`:''}`;
  await navigator.clipboard.writeText(url);
  const old=$('shareBtn').textContent;$('shareBtn').textContent='Enlace copiado';setTimeout(()=>$('shareBtn').textContent=old,1400);
}
init().catch(err=>{$('alerts').innerHTML=`<div class="alert error">No se pudieron cargar los horarios: ${esc(err.message)}</div>`;console.error(err)});
