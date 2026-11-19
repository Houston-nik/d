(function(){
  var $=function(s,c){return (c||document).querySelector(s)};
  var fmtRub=function(n){return Math.round(n).toLocaleString('ru-RU').replace(/\u202f|\u00a0/g,'\u00a0')+'\u00a0₽'};
  var nb=function(s){return s.replace(/ /g,'\u00a0')};

  /* ---------- калькулятор (все цены условные) ---------- */
  var F={
    furshet:{name:'Фуршет',min:15,max:300,base:1800,ware:150,ratio:15,deliv:3500,staff:true,wareOn:true,
      staffS:'один на 15 гостей, 4 500 ₽ за человека на мероприятие',wareS:'фарфор, стекло, текстиль в аренду, 150 ₽ на гостя',delivT:'Привоз, накрытие и уборка',delivS:'3 500 ₽ по Петербургу, пригороды считаем отдельно'},
    banket:{name:'Банкет',min:20,max:150,base:3200,ware:350,ratio:10,deliv:3500,staff:true,wareOn:true,
      staffS:'один на 10 гостей, 4 500 ₽ за человека на мероприятие',wareS:'фарфор, стекло, скатерти и салфетки, 350 ₽ на гостя',delivT:'Привоз, накрытие и уборка',delivS:'3 500 ₽ по Петербургу, пригороды считаем отдельно'},
    coffee:{name:'Кофе-брейк',min:10,max:200,base:650,ware:90,ratio:30,deliv:3500,staff:true,wareOn:true,
      staffS:'один на 30 гостей, 4 500 ₽ за человека на мероприятие',wareS:'чашки, блюдца, термосы, 90 ₽ на гостя',delivT:'Привоз, накрытие и уборка',delivS:'3 500 ₽ по Петербургу, пригороды считаем отдельно'},
    sets:{name:'Сеты',min:5,max:200,base:900,ware:0,ratio:0,deliv:600,staff:false,wareOn:false,
      staffS:'для сетов не нужны: они едут в закрытых боксах',wareS:'не нужна: в боксе одноразовая эко-посуда, она уже в цене',delivT:'Доставка',delivS:'600 ₽ по Петербургу, к назначенному часу'}
  };
  var WAITER=4500;
  var range=$('#guests-range'),num=$('#guests'),hint=$('#guests-hint');
  var oStaff=$('#o-staff'),oWare=$('#o-ware'),oDeliv=$('#o-deliv');
  var lines=$('#r-lines'),totalEl=$('#r-total'),perEl=$('#r-per');
  var last=null;

  function cur(){return $('input[name=fmt]:checked').value}
  function clamp(v,f){v=parseInt(v,10);if(isNaN(v))v=f.min;return Math.max(f.min,Math.min(f.max,v))}

  function setFormat(key){
    var f=F[key];
    range.min=num.min=f.min;range.max=num.max=f.max;
    var v=clamp(num.value,f);num.value=range.value=v;
    hint.textContent=(key==='sets'?'Для сетов от ':'Для формата «'+f.name.toLowerCase()+'» от ')+f.min+(key==='sets'?' штук до ':' до ')+f.max+(key==='sets'?' штук.':' гостей.');
    $('#o-staff-s').textContent=f.staffS;$('#o-ware-s').textContent=f.wareS;
    $('#o-deliv-t').textContent=f.delivT;$('#o-deliv-s').textContent=f.delivS;
    oStaff.disabled=!f.staff;oWare.disabled=!f.wareOn;
    if(!f.staff)oStaff.checked=false;else if(!oStaff.dataset.t)oStaff.checked=true;
    if(!f.wareOn)oWare.checked=false;else if(!oWare.dataset.t)oWare.checked=true;
  }
  ['staff','ware'].forEach(function(k){var el=k==='staff'?oStaff:oWare;el.addEventListener('change',function(){el.dataset.t=el.checked?'':'1'})});

  function row(a,b,s){return '<tr><td>'+a+(s?'<small>'+s+'</small>':'')+'</td><td>'+b+'</td></tr>'}
  function calc(){
    var key=cur(),f=F[key],g=clamp(num.value,f),h='',sum=0;
    var food=g*f.base;sum+=food;
    var unit=key==='sets'?'сетов':'гостей';
    h+=row(f.name+', '+g+' '+unit+' × '+nb(fmtRub(f.base)),fmtRub(food),key==='furshet'?'меню по примеру ниже':'меню подберём под бюджет');
    if(f.staff&&oStaff.checked){var n=Math.ceil(g/f.ratio);var s=n*WAITER;sum+=s;h+=row('Официанты, '+n+' × '+nb(fmtRub(WAITER)),fmtRub(s))}
    if(f.wareOn&&oWare.checked){var w=g*f.ware;sum+=w;h+=row('Посуда и скатерти, '+g+' × '+nb(fmtRub(f.ware)),fmtRub(w))}
    if(oDeliv.checked){sum+=f.deliv;h+=row(f.delivT,fmtRub(f.deliv))}
    lines.innerHTML=h;
    totalEl.textContent=fmtRub(sum);
    perEl.textContent='≈ '+fmtRub(sum/g)+(key==='sets'?' за сет':' на гостя');
    last={fmt:f.name,g:g,unit:unit,sum:sum};
  }
  document.querySelectorAll('input[name=fmt]').forEach(function(r){r.addEventListener('change',function(){setFormat(r.value);calc()})});
  range.addEventListener('input',function(){num.value=range.value;calc()});
  num.addEventListener('input',function(){var f=F[cur()],v=parseInt(num.value,10);if(!isNaN(v)){range.value=Math.max(f.min,Math.min(f.max,v))}calc()});
  num.addEventListener('change',function(){var f=F[cur()];num.value=range.value=clamp(num.value,f);calc()});
  [oStaff,oWare,oDeliv].forEach(function(e){e.addEventListener('change',calc)});
  setFormat('furshet');calc();

  /* кнопки «Рассчитать …» в блоке форматов */
  document.querySelectorAll('[data-fmt]').forEach(function(b){b.addEventListener('click',function(){
    var r=$('input[name=fmt][value='+b.dataset.fmt+']');r.checked=true;setFormat(b.dataset.fmt);calc();
    $('#calc').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  })});

  /* расчёт → форма */
  var sum=$('#calc-summary'),sumT=$('#calc-summary-t');
  $('#calc-send').addEventListener('click',function(){
    sumT.textContent='Ваш расчёт: '+last.fmt.toLowerCase()+', '+last.g+' '+last.unit+', около '+fmtRub(last.sum)+'. Передадим вместе с заявкой.';
    sum.hidden=false;
    var fg=$('#f-guests');if(!fg.value)fg.value=last.g;
    $('#order').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    setTimeout(function(){$('#f-name').focus({preventScroll:true})},500);
  });
  $('#calc-summary-x').addEventListener('click',function(){sum.hidden=true});

  /* ---------- форма ---------- */
  var form=$('#lead-form'),phone=$('#f-phone');
  phone.addEventListener('input',function(){
    var d=phone.value.replace(/\D/g,'');
    if(!d){phone.value='';return}
    if(d[0]==='8')d='7'+d.slice(1);
    if(d[0]!=='7')d='7'+d;
    d=d.slice(0,11);
    var o='+7';
    if(d.length>1)o+=' ('+d.slice(1,4);
    if(d.length>=4)o+=')';
    if(d.length>4)o+=' '+d.slice(4,7);
    if(d.length>7)o+='-'+d.slice(7,9);
    if(d.length>9)o+='-'+d.slice(9,11);
    phone.value=o;
  });
  function err(id,input,msg){var e=$('#'+id);e.textContent=msg||'';if(input){if(msg)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid')}return !msg}
  var name=$('#f-name'),agree=$('#f-agree'),msgBox=$('#demo-msg');
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var ok=true,first=null;
    var a=err('e-name',name,name.value.trim().length<2?'Напишите, как к вам обращаться':'');
    var p=err('e-phone',phone,phone.value.replace(/\D/g,'').length<11?'Введите номер полностью, 11 цифр':'');
    var c=err('e-agree',null,agree.checked?'':'Нужно согласие на обработку данных, иначе мы не сможем перезвонить');
    if(!a)first=name;else if(!p)first=phone;else if(!c)first=agree;
    if(first){first.focus();msgBox.hidden=true;return}
    msgBox.hidden=false;
    msgBox.innerHTML='<b>Это демо: заявка никуда не отправлена.</b>В рабочей версии здесь будет: «Спасибо, '+name.value.trim().replace(/[<>&]/g,'')+'! Перезвоним на '+phone.value+' в течение 15 минут в рабочее время».';
    msgBox.scrollIntoView({block:'nearest'});
  });
  [name,phone].forEach(function(i){i.addEventListener('input',function(){i.removeAttribute('aria-invalid');var e=$('#e-'+(i===name?'name':'phone'));e.textContent=''})});
  agree.addEventListener('change',function(){$('#e-agree').textContent=''});

  /* ---------- липкая кнопка: прячем у формы и в подвале ---------- */
  var st=$('#sticky');
  if(st&&'IntersectionObserver' in window){
    var vis={};
    var io=new IntersectionObserver(function(es){es.forEach(function(e){vis[e.target.id||'foot']=e.isIntersecting});st.classList.toggle('is-hidden',!!(vis.order||vis.foot))},{threshold:0.05});
    io.observe($('#order'));var ft=$('.foot');ft.id='foot';io.observe(ft);
  }
})();
