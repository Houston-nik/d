/* Слоёвый аватар (стиль A, глянец). Агент «готов», когда у него в data/agents.json есть слои:
   layers:{dir:'layers/<slug>/', files:{body:'body.webp', eyes:'eyes.webp', eyes_closed:'eyes-closed.webp'}, eyes_center:[x%,y%]}
   body - тело вместе с головой и предметом, eyes - открытые глаза, eyes_closed - кадр закрытых глаз (все одного размера).
   Моргание: на ~120 мс показывается eyes_closed. Если кадра нет, глаза сжимаются по вертикали (scaleY 0,1) вокруг eyes_center.
   Агенты без слоёв на сайте не показываются. */
(function(){
  'use strict';
  var NIK=window.NIK;
  NIK.normalizeLayers=function(a){
    var L=a&&a.layers; if(!L)return null;
    var dir=L.dir||('layers/'+a.slug+'/'),files={};
    var list=L.layers||L.items;
    if(Array.isArray(list)){ /* форма: [{name,file|src}] */
      list.forEach(function(it){var n=it.name||it.id; files[n]=it.file||it.src||it.path});
    }else{
      var f=L.files||{}; Object.keys(f).forEach(function(n){files[n]=f[n]});
    }
    var closed=files.eyes_closed||files['eyes-closed']||files.closed;
    if(!files.body||!files.eyes)return null;
    var c=L.eyes_center||L.eyesCenter,ec=null;
    if(c){ec=Array.isArray(c)?c:[c.x_pct,c.y_pct]}
    return {dir:dir,body:dir+files.body,eyes:dir+files.eyes,closed:closed?dir+closed:null,center:ec};
  };
  NIK.ready=function(list){return list.filter(function(a){return NIK.normalizeLayers(a)})};
  function img(src,cls,lazy){return '<img class="l '+cls+'" src="'+src+'" alt="" draggable="false"'+(lazy?' loading="lazy"':'')+'>'}
  /* готовая фигура: тело + глаза (+ кадр закрытых глаз), прозрачный фон, ничего не обрезается */
  NIK.layerFig=function(a,lazy){
    var n=NIK.normalizeLayers(a); if(!n)return '';
    var c=n.center||[50,45];
    return '<div class="fig lay'+(n.closed?'':' noclosed')+'" role="img" aria-label="Маскот: '+NIK.esc(a.name)+'" style="--ex:'+c[0]+'%;--ey:'+c[1]+'%">'+
      img(n.body,'l-body',lazy)+img(n.eyes,'l-eyes',lazy)+(n.closed?img(n.closed,'l-eyes-c',lazy):'')+'</div>';
  };
  /* моргание только у активного слайда: первое через 150-250 мс после переключения, дальше каждые 1,8-3 с (иногда двойное); reduced-motion: выключено */
  NIK.initAvatarAnim=function(sw){
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    var timer=null,token=0;
    function clearAll(){var all=sw.el.querySelectorAll('.fig.anim,.fig.blinking');for(var i=0;i<all.length;i++){all[i].classList.remove('anim','blinking')}}
    function blinkOnce(f,cb){f.classList.add('blinking');setTimeout(function(){f.classList.remove('blinking');if(cb)cb()},120)}
    function apply(){
      token++;var my=token;clearTimeout(timer);clearAll();
      if(reduce.matches)return;
      var sl=sw.slides[sw.activeIndex]; var f=sl&&sl.querySelector('.fig'); if(!f)return;
      f.classList.add('anim');
      /* первое моргание сразу после переключения (150-250 мс), дальше schedule */
      timer=setTimeout(function(){if(my===token)step(my,f)},150+Math.random()*100);
    }
    /* моргание; примерно в каждом четвёртом случае двойное; затем случайная пауза 1,8-3 с */
    function step(my,f){
      var again=function(){timer=setTimeout(function(){if(my===token)step(my,f)},1800+Math.random()*1200)};
      if(Math.random()<0.25){blinkOnce(f,function(){timer=setTimeout(function(){if(my!==token)return;blinkOnce(f,again)},110)})}
      else blinkOnce(f,again);
    }
    sw.on('slideChange',apply); reduce.addEventListener&&reduce.addEventListener('change',apply);
    apply();
  };
})();
