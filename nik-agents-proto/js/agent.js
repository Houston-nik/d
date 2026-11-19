(function(){
  'use strict';
  var E=NIK.esc,root=document.getElementById('root');
  var id=new URLSearchParams(location.search).get('id');
  function paras(t){return t.split(/\n\n+/).map(function(p){return '<p>'+E(p)+'</p>'}).join('')}
  NIK.load().then(function(D){
    var ALL=D.agents,A=NIK.ready(ALL),i=-1;
    var cur=ALL.filter(function(x){return x.slug===id})[0];for(var k=0;k<A.length;k++)if(A[k].slug===id)i=k;
    if(!cur){document.title='Агент не найден | Ник Houston';root.innerHTML='<div class="stub"><h1>Агент не найден</h1><p>Такого адреса нет. Выберите агента из списка.</p><a class="btn" href="agents.html">К агентам</a></div>';return}
    var a=cur,prev=A[(i<0?0:i+A.length-1)%A.length],next=A[(i<0?A.length-1:i+1)%A.length];
    var port=a.layers?NIK.layerFig(a):'<div class="soonface"><span>Портрет скоро</span></div>';
    document.title=a.name+' | Ник Houston';
    var full=!!a.description;
    var cs=D.cases.filter(function(c){return c.agents&&c.agents.indexOf(a.slug)>-1});
    var facts=a.facts?'<dl class="facts">'+a.facts.map(function(f){return '<dt>'+E(f.k)+'</dt><dd>'+E(f.v)+'</dd>'}).join('')+'</dl>':'';
    var video=a.video_url?'<video controls preload="metadata" src="'+E(a.video_url)+'"></video>':(a.layers?NIK.layerFig(a):'')+'<p>Видео: агент рассказывает о себе голосом — скоро</p>';
    var desc=full?'<div class="txt">'+paras(a.description)+'</div>':'<div class="note"><p><strong>Подробное описание будет.</strong> Пока известно главное: '+E(a.skills_short.charAt(0).toLowerCase()+a.skills_short.slice(1))+'.</p></div>';
    var steps=a.how?'<h2 class="h3s" style="margin-top:44px">Как работает</h2><ol class="steps">'+a.how.map(function(s){return '<li>'+E(s)+'</li>'}).join('')+'</ol>':'';
    var skills='<h2 class="h3s">Что умеет</h2><ul class="list">'+a.skills.map(function(s){return '<li>'+E(s)+'</li>'}).join('')+'</ul>';
    var cases=cs.length?'<div class="cases">'+cs.map(function(c){return NIK.caseCard(c,A,true)}).join('')+'</div>':'<div class="ph-case" style="max-width:520px"><strong>Кейс будет</strong><span>Работы этого агента появятся здесь, когда будут настоящие.</span></div>';
    root.innerHTML=
      '<p class="crumbs"><a href="agents.html">Агенты</a> / '+E(a.name)+'</p>'+
      '<div class="ag"><div class="face"><div class="big">'+port+'</div><h1>'+E(a.name)+'</h1><p class="dep">'+E(a.department)+'</p><p class="lead">'+E(a.skills_short)+'</p>'+facts+'</div>'+
      '<div class="laptop" role="group" aria-label="Видео об агенте"><div class="screen"><div class="poster">'+video+'</div></div><div class="base"></div></div></div>'+
      '<section class="blk"><div class="two"><div><h2 class="h3s">Об агенте</h2>'+desc+steps+'</div><div>'+skills+'</div></div></section>'+
      '<section class="blk"><h2 class="h3s">Кейсы агента</h2>'+cases+'</section>'+
      '<section class="blk"><div class="pn"><a class="btn ghost" href="'+NIK.agentUrl(prev)+'">Предыдущий: '+E(prev.name)+'</a><a class="btn ghost" href="'+NIK.agentUrl(next)+'">Следующий: '+E(next.name)+'</a></div></section>';
    document.documentElement.setAttribute('data-ready','1');
  }).catch(function(e){root.innerHTML='<p class="empty">Не удалось загрузить данные.</p>';console.error(e)});
})();
