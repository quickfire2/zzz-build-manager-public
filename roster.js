/* Visual roster and build-detail enhancement for the existing ZZZ editor.
   Uses the current site's builds, Enka references, and local-storage workflow. */
(() => {
  const workspace = document.getElementById('workspace');
  const main = workspace.querySelector('main');
  const tools = main.querySelector('.tools');
  const footer = main.querySelector('footer');
  const detail = document.createElement('section');
  detail.id = 'visualDetail';
  detail.hidden = true;
  main.insertBefore(detail, tools);
  while (detail.nextSibling && detail.nextSibling !== footer) {
    detail.appendChild(detail.nextSibling);
  }

  const roster = document.createElement('section');
  roster.id = 'visualRoster';
  roster.setAttribute('aria-label', 'Agent roster');
  roster.innerHTML = [
    '<div class="roster-heading">',
      '<div><span class="eyebrow">YOUR COLLECTION</span><h2>Your Agents</h2>',
      '<p>Choose an agent to explore their builds, equipment and skills.</p></div>',
      '<div class="roster-actions"><span id="rosterCount" class="badge"></span>',
      '<input id="rosterSearch" type="search" placeholder="Search agents…" aria-label="Search agents">',
      '<button id="rosterAdd" class="btn alt" type="button">+ Add agent</button>',
      '<button id="rosterImport" class="btn alt" type="button">Import JSON</button></div>',
    '</div><div class="roster-grid" id="rosterCards"></div>',
    '<div class="empty" id="rosterEmpty" hidden></div>'
  ].join('');
  main.insertBefore(roster, detail);

  const back = document.createElement('div');
  back.className = 'detail-back';
  back.innerHTML = '<button id="backRoster" type="button" class="btn alt">← All agents</button><span class="muted">Agent build details</span>';
  detail.insertBefore(back, detail.firstChild);

  let showingRoster = true;
  const originalRender = render;
  const originalAgentList = agentList;
  const originalOpenAccount = openAccount;

  const imagePath = (kind,id) => {
    const info = kind === 'agent' ? refs?.avatars?.[id]
      : kind === 'engine' ? refs?.weapons?.[id]
      : refs?.equipments?.Suits?.[id];
    const path = kind === 'agent' ? info?.Image : kind === 'engine' ? info?.ImagePath : info?.Icon;
    return typeof path === 'string' && /^\/ui\/zzz\/[a-z0-9_.\/-]+\.(png|webp)$/i.test(path)
      ? 'https://enka.network' + path : '';
  };
  const imageMarkup = (kind,id,placeholder) => {
    const src = imagePath(kind,id);
    return '<div class="picture"><span class="picture-fallback" aria-hidden="true">'+esc(placeholder||'◆')+'</span>'+
      (src ? '<img loading="lazy" decoding="async" alt="" src="'+esc(src)+'" onerror="this.remove()">' : '')+'</div>';
  };
  const accent = id => {
    const color = refs?.avatars?.[id]?.Colors?.Accent;
    return typeof color === 'string' && /^#[a-f0-9]{6}$/i.test(color) ? color : '#7dd3fc';
  };
  function uniqueAgents() {
    return [...new Set(builds.map(b=>b.agent))].sort((a,b)=>a.localeCompare(b));
  }
  function preferred(name) {
    const options = builds.filter(b=>b.agent===name);
    return options.find(b=>b.live) ||
      options.slice().sort((a,b)=>b.agent_level-a.agent_level||b.mindscape-a.mindscape)[0];
  }
  function updateRoster() {
    const names = uniqueAgents();
    const query = document.getElementById('rosterSearch').value.trim().toLowerCase();
    const matched = names.filter(name=>name.toLowerCase().includes(query));
    document.getElementById('rosterCount').textContent = names.length+' agents · '+builds.length+' builds';
    document.getElementById('rosterCards').innerHTML = matched.map(name => {
      const b = preferred(name);
      if (!b) return '';
      const a = refs?.avatars?.[b.agent_id] || {};
      const classification = (a.ElementTypes||[]).join(' / ')||a.ProfessionType||'Agent';
      const initials = name.split(/[\s-]+/).map(x=>x[0]).join('').slice(0,2);
      const count = builds.filter(x=>x.agent===name).length;
      return '<button type="button" class="roster-card" data-choose="'+esc(name)+
        '" style="--accent:'+accent(b.agent_id)+'" aria-label="View '+esc(name)+' builds">'+
        '<div class="roster-portrait">'+imageMarkup('agent',b.agent_id,initials)+
        '<span class="roster-element">'+esc(classification)+'</span></div>'+
        '<div class="roster-card-body"><strong>'+esc(name)+'</strong><div class="roster-card-meta">'+
        '<span>Lv. '+b.agent_level+' · M'+b.mindscape+'</span><span>'+count+' build'+(count===1?'':'s')+'</span>'+
        '</div></div></button>';
    }).join('');
    const empty = document.getElementById('rosterEmpty');
    empty.hidden = matched.length>0;
    empty.textContent = names.length ? 'No agents match your search.' : 'No agents yet. Import JSON or add an agent to create your roster.';
  }
  function updateUrl(agentId) {
    try {
      const url = new URL(location.href);
      if(agentId) url.searchParams.set('agent',String(agentId));
      else url.searchParams.delete('agent');
      history.replaceState(null,'',url);
    } catch(e) {}
  }
  function openAgent(name) {
    const b = preferred(name);
    if (!b) return;
    selectedAgent = name;
    selectedBuild = b.build_id;
    editing = false;
    showingRoster = false;
    updateUrl(b.agent_id);
    agentList();
    render();
    window.scrollTo(0,0);
  }
  function backToRoster() {
    showingRoster = true;
    editing = false;
    updateUrl(null);
    render();
    window.scrollTo(0,0);
  }
  function enhanceDetails() {
    const b = current();
    if (!b) return;
    const content = document.getElementById('content');
    const avatar = refs?.avatars?.[b.agent_id]||{};
    const element = (avatar.ElementTypes||[]).join(' / ');
    const hero = document.createElement('section');
    hero.className = 'detail-hero';
    hero.style.setProperty('--accent',accent(b.agent_id));
    hero.innerHTML = imageMarkup('agent',b.agent_id,b.agent.slice(0,2).toUpperCase())+
      '<div class="detail-hero-text"><div class="eyebrow">AGENT BUILD</div><h3>'+esc(b.agent)+'</h3>'+
      '<p>'+esc([element,avatar.ProfessionType].filter(Boolean).join(' · ')||'Agent')+'</p>'+
      '<div class="flex"><span class="badge">Level '+b.agent_level+'</span><span class="badge">M'+b.mindscape+
      '</span><span class="badge">Core '+('ABCDEF'[b.core_enhancement-1]||'—')+'</span></div></div>';
    const summary = content.querySelector(':scope > .grid');
    const panels = [...content.querySelectorAll(':scope > section.panel')];
    const find = phrase => panels.find(p=>p.querySelector('h3')?.textContent.includes(phrase));
    const engine = find('Equipped W-Engine');
    const discs = find('Drive Discs ·');
    if(engine && b.weapon) {
      engine.classList.add('engine-panel');
      const image = document.createElement('div');
      image.className = 'engine-icon';
      image.innerHTML = imageMarkup('engine',b.weapon.id,'W');
      engine.insertBefore(image,engine.querySelector('strong'));
    }
    if(discs) {
      for(const tile of discs.querySelectorAll('.disc')) {
        const label = tile.querySelector('h4');
        const slot = Number(label?.textContent.match(/Slot (\d+)/)?.[1]||0);
        const item = b.discs.find(d=>d.slot===slot);
        if(!item || !label)continue;
        const top = document.createElement('div');
        top.className = 'disc-visual-heading';
        top.innerHTML = imageMarkup('disc',item.set_id,'D'+slot);
        const headings = document.createElement('div');
        headings.append(label,tile.querySelector('.muted'));
        top.append(headings);
        tile.prepend(top);
      }
    }
    const ordered = [hero,summary,find('Calculated character stats'),engine,
      find('Equipped sets'),discs,find('Skills'),find('Drive Disc contributions'),find('Snapshot details')]
      .filter(Boolean);
    for(const other of [...content.children])if(!ordered.includes(other))ordered.push(other);
    content.replaceChildren(...ordered);
  }
  render = function() {
    originalRender();
    updateRoster();
    roster.hidden = !showingRoster;
    detail.hidden = showingRoster;
    workspace.classList.toggle('roster-mode',showingRoster);
    if(!showingRoster)enhanceDetails();
  };
  agentList = function() {
    originalAgentList();
    document.querySelectorAll('#agentNav [data-agent]').forEach(node=>{
      node.onclick=()=>openAgent(node.dataset.agent);
    });
  };
  openAccount = function(uid,incoming,options={}) {
    showingRoster = true;
    const result = originalOpenAccount(uid,incoming,options);
    const target = new URL(location.href).searchParams.get('agent');
    if(target) {
      const match = builds.find(b=>String(b.agent_id)===target);
      if(match)openAgent(match.agent);
    }
    return result;
  };
  document.getElementById('rosterCards').addEventListener('click',e=>{
    const tile=e.target.closest('[data-choose]');if(tile)openAgent(tile.dataset.choose);
  });
  document.getElementById('rosterSearch').addEventListener('input',updateRoster);
  document.getElementById('backRoster').addEventListener('click',backToRoster);
  document.getElementById('rosterAdd').addEventListener('click',()=>document.getElementById('newBtn').click());
  document.getElementById('rosterImport').addEventListener('click',()=>document.getElementById('importFile').click());
  document.getElementById('newBtn').addEventListener('click',()=>{
    if(builds.some(b=>b.agent===selectedAgent)&&editing){showingRoster=false;render();}
  });
  // Restore and newly fetched accounts land on the roster; refresh can still
  // target the current selected agent from an explicit ?agent= link.
  render();
})();