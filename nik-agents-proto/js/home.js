(function(){
  'use strict';
  var E=NIK.esc,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  NIK.load().then(function(D){
    var A=D.agents,C=D.cases;
    document.getElementById('heroSub').textContent=A.length+' '+NIK.agentWord(A.length)+' ведут соцсети, тексты, дизайн, сайты и рекламу. Листайте, выбирайте, открывайте.';
    /* карусель */
    var wrap=document.getElementById('avsWrap');
    wrap.innerHTML=A.map(function(a,i){return '<div class="swiper-slide" role="group" aria-roledescription="слайд" aria-label="'+E(a.name)+', '+(i+1)+' из '+A.length+'"><div class="av">'+'<img src="'+NIK.avatar(a,256)+'" width="256" height="256" alt="Маскот: '+E(a.name)+'" draggable="false">'+'</div></div>'}).join('');
    var now=document.getElementById('now');
    function show(i){
      var a=A[i];
      now.innerHTML='<p class="cnt">'+(i+1)+' из '+A.length+'</p><h2>'+E(a.name)+'</h2><p class="dep">'+E(a.role)+'</p><p class="sk">'+E(a.skills_short)+'</p><a class="btn" href="'+NIK.agentUrl(a)+'" aria-label="Подробнее об агенте: '+E(a.name)+'">Подробнее</a>';
    }
    var el=document.getElementById('avs');
    /* геометрия: кружки стоят друг за другом, наезжают на 30% диаметра, размер растёт к центру */
    var OV=0.26,K=0.13,CIRC=0.88,D0=250;
    function dia(q){return D0*Math.exp(-K*q)}
    function stp(k){return CIRC*((dia(k)+dia(k+1))/2-OV*dia(k+1))}
    function xOf(p){var a=Math.min(Math.abs(p),16),n=Math.floor(a),fr=a-n,acc=0;for(var k=0;k<n;k++)acc+=stp(k);acc+=fr*stp(n);return acc}
    function measure(){D0=el.querySelector('.swiper-slide').offsetWidth||250;if(D0<200){OV=0.34;K=0.15}else{OV=0.26;K=0.13}}
    var sw=new Swiper(el,{loop:true,loopAdditionalSlides:10,centeredSlides:true,slidesPerView:'auto',spaceBetween:0,
      slideToClickedSlide:true,grabCursor:true,watchSlidesProgress:true,speed:reduce?0:450,
      keyboard:{enabled:true,onlyInViewport:true},
      navigation:{prevEl:'#prev',nextEl:'#next'},
      on:{}});
    function paint(){
      var sl=sw.slides;
      for(var i=0;i<sl.length;i++){
        var p=sl[i].progress,ap=Math.abs(p);
        var scale=dia(Math.min(ap,16))/D0;
        /* progress у Swiper: справа от центра отрицательный; естественное смещение слайда = -p*D0 */
        var dx=-Math.sign(p)*xOf(p)+p*D0;
        sl[i].style.transform='translate3d('+dx.toFixed(1)+'px,0,0) scale('+scale.toFixed(4)+')';
        sl[i].style.zIndex=Math.max(1,100-Math.round(ap));
      }
    }
    function sync(){show(sw.realIndex)}
    sw.on('progress',paint);sw.on('setTranslate',paint);sw.on('slideChange',sync);sw.on('resize',function(){measure();sw.update();paint()});
    measure();sync();sw.update();paint();NIK.initAvatarAnim(sw,A);
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
