/* Слоёвый аватар: только моргание. Формат агента в data/agents.json:
   layers:{dir:'layers/<slug>/', files:{body:'body.webp', eyes:'eyes.webp'}}
   body - тело вместе с предметом (на месте глаз залит цвет экрана), eyes - слой с глазами, оба одного размера.
   Центр глаз для моргания берётся автоматически из альфа-канала eyes. Без layers показывается обычная картинка. */
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
    if(!files.body||!files.eyes)return null;
    return {dir:dir,body:dir+files.body,eyes:dir+files.eyes};
  };
  function img(src,cls){return '<img class="'+cls+'" src="'+src+'" alt="" draggable="false">'}
  NIK.layerFig=function(a,alt){
    var n=NIK.normalizeLayers(a); if(!n)return null;
    return '<div class="fig lay" role="img" aria-label="'+NIK.esc(alt)+'">'+img(n.body,'l l-body')+img(n.eyes,'l l-eyes')+'</div>';
  };
  var pivCache={};
  function eyeCenter(im){ /* центр непрозрачной области слоя eyes, в процентах */
    var k=im.src; if(pivCache[k])return pivCache[k];
    var r=[50,45];
    try{
      var w=Math.min(im.naturalWidth,320),h=Math.round(im.naturalHeight*w/im.naturalWidth);
      var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.drawImage(im,0,0,w,h);
      var d=x.getImageData(0,0,w,h).data,x0=w,x1=-1,y0=h,y1=-1;
      for(var j=0;j<h;j++)for(var i=0;i<w;i++)if(d[(j*w+i)*4+3]>40){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j}
      if(x1>=0)r=[(x0+x1)/2/w*100,(y0+y1)/2/h*100];
    }catch(e){}
    return pivCache[k]=r;
  }
  /* запуск: слои и моргание только у активного слайда; у остальных обычная картинка */
  NIK.initAvatarAnim=function(sw,A){
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    var timer=null,token=0,curSlide=null;
    function plainAll(){
      var on=sw.el.querySelectorAll('.av.lay-on');
      for(var i=0;i<on.length;i++){on[i].innerHTML=on[i].__plain;on[i].classList.remove('lay-on')}
    }
    function apply(){
      var sl0=sw.slides[sw.activeIndex];
      if(sl0&&sl0===curSlide&&!reduce.matches)return; /* уже подключено или грузится для этого слайда */
      curSlide=null;
      token++;var my=token;
      clearTimeout(timer); plainAll();
      if(reduce.matches)return; /* reduced-motion: статичная картинка, моргания нет */
      var sl=sw.slides[sw.activeIndex]; if(!sl)return;
      var idx=+sl.getAttribute('data-swiper-slide-index'); if(isNaN(idx))idx=sw.activeIndex;
      var a=A[idx],n=NIK.normalizeLayers(a); if(!n)return;
      var av=sl.querySelector('.av'); if(!av)return;
      curSlide=sl;
      var b=new Image(),e=new Image(),left=2;
      function done(){
        if(--left||my!==token)return;
        av.__plain=av.innerHTML;
        av.innerHTML=NIK.layerFig(a,'Маскот: '+a.name);
        av.classList.add('lay-on');
        var f=av.querySelector('.fig'),c=eyeCenter(e);
        f.style.setProperty('--ex',c[0]+'%');f.style.setProperty('--ey',c[1]+'%');
        f.classList.add('anim'); schedule(my);
      }
      b.onload=e.onload=done; b.onerror=e.onerror=function(){left=99;curSlide=null};
      b.src=n.body; e.src=n.eyes;
    }
    function schedule(my){
      timer=setTimeout(function(){
        if(my!==token)return;
        var el=sw.el.querySelector('.fig.anim .l-eyes');
        if(el){el.classList.add('blink');setTimeout(function(){el.classList.remove('blink')},120)}
        schedule(my);
      },3000+Math.random()*2000);
    }
    sw.on('slideChange',apply); reduce.addEventListener&&reduce.addEventListener('change',apply);
    apply();
  };
})();
