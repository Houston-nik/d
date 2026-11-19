(function(){
  'use strict';
  var E=NIK.esc;
  NIK.load().then(function(D){
    var ALL=D.agents,A=NIK.ready(ALL),TOTAL=ALL.length;
    var grid=document.getElementById('grid'),chips=document.getElementById('chips'),cnt=document.getElementById('agCount');
    var cur=decodeURIComponent((location.hash||'').slice(1))||'Все';
    var deps=['Все'].concat(D.departments.filter(function(d){return A.some(function(a){return a.department===d})}));
    if(deps.indexOf(cur)<0)cur='Все';
    function renderChips(){
      chips.innerHTML=deps.map(function(d){var n=d==='Все'?A.length:A.filter(function(a){return a.department===d}).length;return '<button class="chip" type="button" data-d="'+E(d)+'" aria-pressed="'+(d===cur)+'">'+E(d)+' '+n+'</button>'}).join('');
    }
    function renderGrid(){
      var L=cur==='Все'?A:A.filter(function(a){return a.department===cur});
      cnt.textContent=(A.length<TOTAL?'Готово '+A.length+' из '+TOTAL+'.':A.length+' '+NIK.agentWord(A.length)+'.')+(cur==='Все'?'':' В этом отделе: '+L.length+'.');
      grid.innerHTML=L.map(NIK.agentCard).join('');
    }
    chips.addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;cur=b.getAttribute('data-d');history.replaceState(null,'',cur==='Все'?location.pathname:'#'+encodeURIComponent(cur));renderChips();renderGrid();var f=chips.querySelector('[aria-pressed=true]');if(f)f.focus()});
    renderChips();renderGrid();
    document.documentElement.setAttribute('data-ready','1');
  }).catch(function(e){document.getElementById('grid').innerHTML='<p class="empty">Не удалось загрузить данные.</p>';console.error(e)});
})();
