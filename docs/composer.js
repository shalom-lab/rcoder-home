(() => {
  'use strict';
  const root = document.getElementById('agent-preview');
  if (!root) return;
  const $ = s => root.querySelector(s);
  const input = $('#agent-input'), form = $('.agent-form'), send = $('.agent-send');
  const cycle = $('.agent-cycle'), live = $('.agent-live'), result = $('.agent-result');
  const artifacts = $('.agent-artifacts'), next = $('.agent-next'), graphic = $('.agent-graphic');
  const buttons = [...root.querySelectorAll('[data-scene]')];
  const [a,b,c,d,strings] = [...$('#agent-scenes').content.children].map(el => el.dataset);
  const scenes = [a,b,c,d];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const data = [
    {file:'recreate.R',code:`d <- datasets::anscombe
par(mfrow = c(2, 2))
for (i in 1:4) {
  x <- d[[i]]; y <- d[[i + 4]]
  plot(x, y, xlim = c(3, 20),
       ylim = c(2, 15), pch = 19)
  abline(lm(y ~ x), col = "#315AEA")
}`},
    {file:'sales_summary.R',code:`sales <- data.frame(
  region = c("East", "East", "West", "West"),
  amount = c(120, 80, 110, 140))
total <- aggregate(amount ~ region, sales, sum)
barplot(total$amount, names.arg = total$region)
write.csv(total, "sales_summary.csv",
          row.names = FALSE)`},
    {file:'plant_growth.R',code:`d <- datasets::PlantGrowth
fit <- aov(weight ~ group, data = d)
summary(fit)
boxplot(weight ~ group, data = d,
        ylab = "Dried weight")`},
    {file:'check_sales.R',code:`sales <- data.frame(
  order = c("A01", "A02", "A02", "A03"),
  price = c(120, NA, 140, 110))
which(is.na(sales$price))
which(duplicated(sales$order) |
      duplicated(sales$order, fromLast = TRUE))`}
  ];
  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  function graph(i, scene) {
    const labels = scene.labels.split('|');
    if (i === 0) {
      const img = el('img'); img.src = strings.asset;
      img.alt = strings.anscombeAlt; img.width = 960; img.height = 840;
      return img;
    }
    if (i === 1 || i === 3) {
      const list = el('ul', i === 1 ? 'agent-bars' : 'agent-issues');
      const values = i === 1 ? [200,250] : ['2','2, 3'];
      labels.forEach((label,j) => {
        const row = el('li'); row.append(el('span','',label),el('strong','',values[j]));
        if (i === 1) {
          const bar = el('i'); bar.setAttribute('aria-hidden','true');
          bar.style.setProperty('--fill', (100*values[j]/250)+'%'); row.append(bar);
        }
        list.append(row);
      });
      return list;
    }
    // R boxplot hinges and whiskers from the built-in PlantGrowth dataset.
    const boxes = [[4.17,4.53,5.155,5.33,6.11,[]],[3.59,4.17,4.55,4.89,5.87,[6.03]],[4.92,5.26,5.435,5.80,6.31,[]]];
    const wrap=el('div','agent-boxplots');
    const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
    const attr = (tag, values) => {
      const node=document.createElementNS(ns,tag);
      Object.entries(values).forEach(([key,val])=>node.setAttribute(key,val)); svg.append(node);
    };
    const y=v=>98-(v-3.25)*25;
    svg.setAttribute('viewBox','0 0 240 105'); svg.setAttribute('role','img');
    svg.setAttribute('aria-label',scene.note);
    for (const v of [4,5,6]) {
      attr('line',{x1:24,x2:240,y1:y(v),y2:y(v),stroke:'#e0e8f7'});
      attr('text',{x:8,y:y(v)+3,fill:'#41577a','font-size':10}); svg.lastChild.textContent=v;
    }
    boxes.forEach(([lo,q1,median,q3,hi,outliers],j)=>{
      const x=60+j*72;
      attr('line',{x1:x,x2:x,y1:y(hi),y2:y(lo),stroke:'#254f9e','stroke-width':2});
      for (const v of [lo,hi]) attr('line',{x1:x-8,x2:x+8,y1:y(v),y2:y(v),stroke:'#254f9e'});
      attr('rect',{x:x-17,y:y(q3),width:34,height:y(q1)-y(q3),rx:3,fill:'#d9e8ff',stroke:'#254f9e'});
      attr('line',{x1:x-17,x2:x+17,y1:y(median),y2:y(median),stroke:'#254f9e','stroke-width':2});
      outliers.forEach(v=>attr('circle',{cx:x,cy:y(v),r:2.5,fill:'#fff',stroke:'#254f9e'}));
    });
    const names=el('div','agent-plot-labels');
    labels.forEach(label=>names.append(el('span','',label)));
    wrap.append(svg,names);
    return wrap;
  }
  let selected = 0, auto = !preference.matches, timer = 0, typeTimer = 0, runTimer = 0, typing = false;
  let inView = true, playedIntro = false;
  const canAnimate = () => !preference.matches;
  function controls() {
    buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(selected===i)));
    send.disabled = !input.value.trim();
    cycle.textContent = auto ? cycle.dataset.pause : cycle.dataset.play;
    cycle.setAttribute('aria-pressed',String(auto));
  }
  function queue() {
    clearTimeout(timer);
    if (!auto || !inView || document.hidden) return;
    timer = setTimeout(() => {
      const i = playedIntro ? (selected+1)%scenes.length : selected;
      playedIntro=true; choose(i,true);
    }, playedIntro ? 3400 : 570);
  }
  function finishTyping(complete) {
    clearTimeout(typeTimer);
    if (typing && complete && selected >= 0) input.value=scenes[selected].prompt;
    typing=false; root.classList.remove('is-typing'); controls();
  }
  function pause() {
    auto = false; clearTimeout(timer); finishTyping(true);
  }
  function choose(i, animate) {
    clearTimeout(timer); clearTimeout(runTimer); finishTyping(false);
    playedIntro=true; selected=i; live.textContent=''; result.hidden=true;
    const prompt = scenes[i].prompt;
    if (!animate || !canAnimate()) {
      input.value = prompt; controls(); queue(); return;
    }
    const chars=Array.from(prompt); let n=0;
    const size=chars.length>80 ? 2 : 1;
    const step=() => {
      n = Math.min(chars.length,n+size);
      input.value = chars.slice(0,n).join('');
      controls();
      if (n < chars.length) {
        typeTimer=setTimeout(step, n%13===0?59:23);
      } else {
        finishTyping(true); queue();
      }
    };
    typing=true; root.classList.add('is-typing'); step();
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{
    pause(); choose(i,true);
  }));
  input.addEventListener('focus',pause);
  input.addEventListener('input',()=> {
    pause();
    selected=scenes.findIndex(s=>s.prompt===input.value.trim());
    clearTimeout(runTimer); result.hidden=true; live.textContent=''; controls();
  });
  input.addEventListener('keydown',e=>{
    if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&!e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  cycle.addEventListener('click',()=> {
    if (auto) { pause(); return; }
    auto=true; choose((selected+1)%scenes.length,true);
  });
  preference.addEventListener?.('change',e=>{if(e.matches) pause();});
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) finishTyping(true);
    queue();
  });
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(([entry])=>{
      inView=entry.isIntersecting;
      if (!inView) finishTyping(true);
      queue();
    });
    observer.observe(root);
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    pause();
    const string=input.value.trim(); if(!string) return;
    clearTimeout(runTimer);
    const i=scenes.findIndex(s=>s.prompt===string), match=i>=0;
    $('.agent-sent').textContent=strings.sent+' '+string;
    artifacts.hidden=true; next.hidden=match; result.hidden=false;
    $('.agent-result-state').textContent=match?strings.running:strings.custom;
    live.textContent=match?strings.running:strings.custom;
    if (!match) return;
    const show = () => {
      const scene=scenes[i];
      $('.agent-filename').textContent=data[i].file;
      $('.agent-code-content').textContent=data[i].code;
      $('.agent-output h3').textContent=scene.note;
      $('.agent-output p').textContent=scene.detail;
      graphic.replaceChildren(graph(i,scene));
      $('.agent-result-state').textContent=strings.done;
      live.textContent=strings.done;
      artifacts.hidden=false;
    };
    if (canAnimate()) runTimer=setTimeout(show,560); else show();
  });
  controls(); queue();
})();
