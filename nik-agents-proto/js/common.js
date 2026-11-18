(function(){
  'use strict';
  var NIK=window.NIK={};
  NIK.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  NIK.load=function(){
    return fetch('data/agents.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){
      if(window.NIK_DATA)return window.NIK_DATA; throw new Error('no data');
    });
  };
  NIK.agentUrl=function(a){return 'agent.html?id='+encodeURIComponent(a.slug)};
    NIK.agentWord=function(n){var m=n%10,h=n%100;return (m==1&&h!=11)?'агент':(m>=2&&m<=4&&(h<12||h>14))?'агента':'агентов'};
  // меню
  var b=document.getElementById('burger'),n=document.getElementById('nav');
  if(b&&n){
    b.addEventListener('click',function(){var o=!n.classList.contains('open');n.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Закрыть меню':'Открыть меню')});
    n.addEventListener('click',function(e){if(e.target.closest('a')){n.classList.remove('open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Открыть меню')}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&n.classList.contains('open')){n.classList.remove('open');b.setAttribute('aria-expanded','false');b.focus()}});
  }
  var pg=document.body.getAttribute('data-page');
  if(pg==='blog'){var l=document.querySelector('[data-nav=blog]');if(l)l.setAttribute('aria-current','page')}
  // карточка кейса, общая для главной и страницы агента
  NIK.caseCard=function(c,agents,hideAgent){
    var ag=!hideAgent&&c.agents&&c.agents.length?c.agents.map(function(s){var a=agents.filter(function(x){return x.slug===s&&x.layers})[0];return a?'<a class="btn ghost" href="'+NIK.agentUrl(a)+'">Агент: '+NIK.esc(a.name)+'</a>':''}).join(''):'';
    return '<article class="case"><div class="cv"><img src="'+NIK.esc(c.cover)+'" width="640" height="400" loading="lazy" alt="Первый экран: '+NIK.esc(c.title)+'"></div><div class="tx"><span class="type">'+NIK.esc(c.type)+'</span><h3>'+NIK.esc(c.title)+'</h3><p>'+NIK.esc(c.summary)+'</p><div class="acts"><a class="btn" href="'+NIK.esc(c.url)+'" target="_blank" rel="noopener">Открыть демо</a>'+ag+'</div></div></article>';
  };
})();
