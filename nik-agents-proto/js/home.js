(function(){
  'use strict';
  var E=NIK.esc,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  NIK.load().then(function(D){
    var A=D.agents,C=D.cases;
    document.getElementById('heroSub').textContent=A.length+' '+NIK.agentWord(A.length)+' ведут соцсети, тексты, дизайн, сайты и рекламу. Листайте, выбирайте, открывайте.';
    /* карусель */
    var wrap=document.getElementById('avsWrap');
    wrap.innerHTML=A.map(function(a,i){return '<div class="swiper-slide" role="group" aria-roledescription="слайд" aria-label="'+E(a.name)+', '+(i+1)+' из '+A.length+'"><div class="av">'+(NIK.layerFig(a,'Маскот: '+a.name)||'<img src="'+NIK.avatar(a,256)+'" width="256" height="256" alt="Маскот: '+E(a.name)+'" draggable="false">')+'</div></div>'}).join('');
    var now=document.getElementById('now');
    function show(i){
      var a=A[i];
      now.innerHTML='<p class="cnt">'+(i+1)+' из '+A.length+'</p><h2>'+E(a.name)+'</h2><p class="dep">'+E(a.role)+'</p><p class="sk">'+E(a.skills_short)+'</p><a class="btn" href="'+NIK.agentUrl(a)+'" aria-label="Подробнее об агенте: '+E(a.name)+'">Подробнее</a>';
    }
    var el=document.getElementById('avs');
    var sw=new Swiper(el,{loop:true,centeredSlides:true,slidesPerView:'auto',spaceBetween:window.innerWidth<761?30:44,
      slideToClickedSlide:true,grabCursor:true,watchSlidesProgress:true,speed:reduce?0:450,
      keyboard:{enabled:true,onlyInViewport:true},
      navigation:{prevEl:'#prev',nextEl:'#next'},
      on:{}});
    function paint(){
      var sl=sw.slides;
      for(var i=0;i<sl.length;i++){
        var p=Math.abs(sl[i].progress);
        var t=Math.max(0,1-p/2.4);
        var scale=reduce?(p<0.5?1.7:1):(0.78+0.95*t*t);
        sl[i].style.transform='scale('+scale.toFixed(3)+')';
        sl[i].style.opacity=(0.38+0.62*Math.min(1,t*1.6)).toFixed(2);
        sl[i].style.zIndex=Math.round(100*t);
      }
    }
    function sync(){show(sw.realIndex)}
    sw.on('progress',paint);sw.on('setTranslate',paint);sw.on('slideChange',sync);sw.on('resize',function(){sw.params.spaceBetween=window.innerWidth<761?30:44;sw.update();paint()});
    sync();sw.update();paint();NIK.initAvatarAnim(sw);
    window.__sw=sw;
    /* сетка и фильтр */
    var grid=document.getElementById('grid'),chips=document.getElementById('chips'),cnt=document.getElementById('agCount'),cur='Все';
    function renderChips(){
      var all=['Все'].concat(D.departments);
      chips.innerHTML=all.map(function(d){var n=d==='Все'?A.length:A.filter(function(a){return a.department===d}).length;return '<button class="chip" type="button" data-d="'+E(d)+'" aria-pressed="'+(d===cur)+'">'+E(d)+' '+n+'</button>'}).join('');
    }
    function renderGrid(){
      var L=cur==='Все'?A:A.filter(function(a){return a.department===cur});
      cnt.textContent=cur==='Все'?('Показаны все '+A.length+'.'):('Показано '+L.length+' из '+A.length+'.');
      grid.innerHTML=L.map(function(a){return '<article class="card"><div class="av"><img src="'+NIK.avatar(a,256)+'" width="256" height="256" loading="lazy" alt="Маскот: '+E(a.name)+'"></div><h3>'+E(a.name)+'</h3><p>'+E(a.skills_short)+'</p><a class="btn ghost" href="'+NIK.agentUrl(a)+'" aria-label="Подробнее об агенте: '+E(a.name)+'">Подробнее</a></article>'}).join('');
    }
    chips.addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;cur=b.getAttribute('data-d');renderChips();renderGrid();var f=chips.querySelector('[aria-pressed=true]');if(f)f.focus()});
    renderChips();renderGrid();
    /* кейсы */
    var feed=document.getElementById('feed');
    var f=C[0],rest=C.slice(1);
    var fa=f.agents&&f.agents.length?A.filter(function(x){return x.slug===f.agents[0]})[0]:null;
    feed.innerHTML='<article class="feat"><div class="cv"><img src="'+E(f.cover)+'" width="640" height="400" loading="lazy" alt="Первый экран: '+E(f.title)+'"></div><div class="tx"><span class="type">'+E(f.type)+'</span><h3>'+E(f.title)+'</h3><p>'+E(f.summary)+'</p><div class="acts"><a class="btn" href="'+E(f.url)+'" target="_blank" rel="noopener">Открыть демо</a>'+(fa?'<a class="btn ghost" href="'+NIK.agentUrl(fa)+'">Агент: '+E(fa.name)+'</a>':'')+'</div></div></article>'+
      '<div class="cases">'+rest.map(function(c){return NIK.caseCard(c,A)}).join('')+'<div class="ph-case"><strong>Кейс будет</strong><span>Работы остальных агентов появятся здесь по мере готовности.</span></div></div>';
    document.documentElement.setAttribute('data-ready','1');
  }).catch(function(e){document.getElementById('now').innerHTML='<p class="empty">Не удалось загрузить данные.</p>';console.error(e)});
})();
