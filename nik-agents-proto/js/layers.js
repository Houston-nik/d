/* Слоёвый аватар. Формат агента в data/agents.json:
   layers:{dir:'layers/<slug>/', files:{body,head,eyes,prop}, pivots:{head:[x%,y%], eyes:[x%,y%], prop:[x%,y%]}, prop_on_top:false}
   Адаптер normalize() приводит к этому виду и другие формы записи (см. README). */
(function(){
  'use strict';
  var NIK=window.NIK;
  function pct(v,size){ // число > 1.5 считаем пикселями, иначе долей; строка '12%' - процентами
    if(typeof v==='string'&&v.slice(-1)==='%')return parseFloat(v);
    v=+v; if(size&&v>100)return v/size*100; return v<=1.5?v*100:v;
  }
  NIK.normalizeLayers=function(a){
    var L=a&&a.layers; if(!L)return null;
    var dir=L.dir||('layers/'+a.slug+'/'),files={},piv={},top=!!(L.prop_on_top||L.propOnTop);
    var cw=L.canvas&&L.canvas[0],ch=L.canvas&&L.canvas[1];
    if(Array.isArray(L.layers||L.items)){ // форма: [{name,file|src,pivot:[x,y]}]
      (L.layers||L.items).forEach(function(it){
        var n=it.name||it.id; files[n]=it.file||it.src||it.path;
        var p=it.pivot||it.origin; if(p){piv[n]=Array.isArray(p)?[pct(p[0],cw),pct(p[1],ch)]:[pct(p.x,cw),pct(p.y,ch)]}
      });
    }else{
      var f=L.files||{}; Object.keys(f).forEach(function(n){files[n]=f[n]});
      var p=L.pivots||{}; Object.keys(p).forEach(function(n){piv[n]=[pct(p[n][0],cw),pct(p[n][1],ch)]});
    }
    if(!files.body||!files.head)return null; // без тела и головы слоёв нет
    return {dir:dir,files:files,pivots:piv,top:top};
  };
  function img(src,cls){return '<img class="'+cls+'" src="'+src+'" alt="" draggable="false">'}
  NIK.layerFig=function(a,alt){
    var n=NIK.normalizeLayers(a); if(!n)return null;
    var u=function(k){return n.dir+n.files[k]},hp=n.pivots.head||[50,60],pp=n.pivots.prop||[50,60],ep=n.pivots.eyes||[50,45];
    var prop=n.files.prop?img(u('prop'),'l l-prop'):'';
    return '<div class="fig lay" role="img" aria-label="'+NIK.esc(alt)+'" style="--hx:'+hp[0]+'%;--hy:'+hp[1]+'%;--px:'+pp[0]+'%;--py:'+pp[1]+'%;--ex:'+ep[0]+'%;--ey:'+ep[1]+'%">'+
      img(u('body'),'l l-body')+(n.top?'':prop)+'<div class="hg">'+img(u('head'),'l l-head')+(n.files.eyes?img(u('eyes'),'l l-eyes'):'')+'</div>'+(n.top?prop:'')+'</div>';
  };
  /* запуск: анимация только у активного слайда */
  NIK.initAvatarAnim=function(sw){
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    var timer=null;
    function figs(){return sw.el.querySelectorAll('.fig.lay')}
    function apply(){
      var all=figs(); for(var i=0;i<all.length;i++)all[i].classList.remove('anim');
      clearTimeout(timer); if(reduce.matches)return;
      var act=sw.slides[sw.activeIndex]; var f=act&&act.querySelector('.fig.lay'); if(!f)return;
      f.classList.add('anim'); schedule();
    }
    function schedule(){
      timer=setTimeout(function(){
        var e=sw.el.querySelector('.fig.anim .l-eyes');
        if(e){e.classList.add('blink');setTimeout(function(){e.classList.remove('blink')},120)}
        if(sw.el.querySelector('.fig.anim'))schedule();
      },3000+Math.random()*2000);
    }
    sw.on('slideChange',apply); reduce.addEventListener&&reduce.addEventListener('change',apply);
    apply();
  };
})();
