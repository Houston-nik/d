(function(){
  // Sticky CTA on mobile: show after the hero button scrolls away, hide near the form
  var sticky=document.getElementById('sticky-cta');
  var heroBtn=document.querySelector('.hero .btn');
  var form=document.getElementById('zapis');
  if(sticky&&heroBtn&&form&&'IntersectionObserver' in window){
    var heroGone=false,formVisible=false;
    var upd=function(){var on=heroGone&&!formVisible;sticky.classList.toggle('on',on);sticky.setAttribute('aria-hidden',on?'false':'true');sticky.querySelector('a').tabIndex=on?0:-1;};
    new IntersectionObserver(function(e){heroGone=!e[0].isIntersecting&&e[0].boundingClientRect.top<0;upd();}).observe(heroBtn);
    new IntersectionObserver(function(e){formVisible=e[0].isIntersecting;upd();}).observe(form);
  }

  // Phone mask +7 (XXX) XXX-XX-XX
  var phone=document.getElementById('f-phone');
  function digits(v){var d=v.replace(/\D/g,'');if(d[0]==='7'||d[0]==='8')d=d.slice(1);return d.slice(0,10);}
  phone.addEventListener('input',function(){
    var d=digits(phone.value),o='+7';
    if(d.length)o+=' ('+d.slice(0,3);
    if(d.length>=3)o+=')';
    if(d.length>3)o+=' '+d.slice(3,6);
    if(d.length>6)o+='-'+d.slice(6,8);
    if(d.length>8)o+='-'+d.slice(8,10);
    phone.value=d.length?o:'';
  });

  var f=document.getElementById('lead-form');
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=document.getElementById('f-name'),agree=document.getElementById('f-agree');
    var pe=document.getElementById('phone-err'),ae=document.getElementById('agree-err');
    var ok=true;
    if(!name.value.trim()){name.setAttribute('aria-invalid','true');ok=false;}else name.removeAttribute('aria-invalid');
    if(digits(phone.value).length!==10){phone.setAttribute('aria-invalid','true');pe.hidden=false;ok=false;}else{phone.removeAttribute('aria-invalid');pe.hidden=true;}
    ae.hidden=agree.checked; if(!agree.checked)ok=false;
    if(!ok){(f.querySelector('[aria-invalid="true"]')||agree).focus();return;}
    document.getElementById('done-name').textContent=name.value.trim();
    Array.prototype.forEach.call(f.querySelectorAll('.field,.check,button,.cta-note'),function(el){el.hidden=true;el.style.display='none';});
    var done=document.getElementById('form-done');done.hidden=false;done.focus();
  });
})();
