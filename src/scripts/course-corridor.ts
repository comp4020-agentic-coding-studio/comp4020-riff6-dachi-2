import { navigate } from 'astro:transitions/client';

type Week = { week: number; title: string; description: string; stage: number; links: { label: string; title: string; href: string }[] };
const forward = new Set(['w', 'arrowup']);
const backward = new Set(['s', 'arrowdown']);
const left = new Set(['a', 'arrowleft']);
const right = new Set(['d', 'arrowright']);
const movement = new Set([...forward, ...backward, ...left, ...right]);

export function mountCorridor(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-corridor-viewport]')!;
  const world = root.querySelector<HTMLElement>('[data-corridor-world]')!;
  const student = root.querySelector<HTMLElement>('[data-corridor-student]')!;
  const model = root.querySelector<HTMLElement>('[data-student-model]')!;
  const prompt = root.querySelector<HTMLElement>('[data-corridor-prompt]')!;
  const positionLabel = root.querySelector<HTMLElement>('[data-corridor-position]')!;
  const portal = root.querySelector<HTMLDialogElement>('[data-corridor-portal]')!;
  const portalTitle = root.querySelector<HTMLElement>('#corridor-portal-title')!;
  const links = root.querySelector<HTMLElement>('[data-portal-links]')!;
  const frames = [...root.querySelectorAll<HTMLElement>('[data-frame]')];
  const jumps = [...root.querySelectorAll<HTMLAnchorElement>('[data-jump]')];
  const weeks: Week[] = JSON.parse(root.querySelector('[data-corridor-data]')!.textContent!);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  const keys = new Set<string>();
  let x = 0, distance = 120, raf = 0, previous = 0, token = 0, opened = -1, suppressed = -1;
  let dwell: ReturnType<typeof setTimeout> | undefined;
  let countdown: ReturnType<typeof setInterval> | undefined;
  let arrival: ReturnType<typeof setTimeout> | undefined;
  let departure: ReturnType<typeof setTimeout> | undefined;
  let manual = false, busy = false;
  let cameraX = 0, cameraDistance = 120, heading = 0;
  const actions = new Set<ReturnType<typeof setTimeout>>();
  const later = (action: () => void, delay: number) => {
    const id = setTimeout(() => { actions.delete(id); if (!signal.aborted) action(); }, delay);
    actions.add(id);
  };
  const clearActions = () => { actions.forEach(clearTimeout); actions.clear(); };
  const settle = () => { cameraX = x * .22; cameraDistance = distance; };
  const face = (degrees: number) => {
    // Use the shortest turn, including when stepping backwards.
    heading += ((degrees - heading + 540) % 360 + 360) % 360 - 180;
    model.style.transform = `rotateY(${heading}deg)`;
  };
  const depth = (index: number) => 550 + Math.floor(index / 2) * 600;
  const nearest = () => {
    if (Math.abs(x) < 150) return -1;
    const row = Math.max(0, Math.min(5, Math.round((distance - 550) / 600)));
    const index = row * 2 + (x > 15 ? 1 : 0);
    return Math.abs(depth(index) - distance) < 285 ? index : -1;
  };
  const clearDwell = () => { clearTimeout(dwell); clearInterval(countdown); dwell = undefined; countdown = undefined; };
  const stop = () => { keys.clear(); cancelAnimationFrame(raf); raf = 0; previous = 0; clearDwell(); student.dataset.state = 'idle'; };
  const render = () => {
    world.style.transform = `translate3d(0, 0, -520px) rotateX(-24deg) translate3d(${-cameraX}px, -195px, ${cameraDistance}px)`;
    student.style.transform = `translate3d(${x}px, 195px, ${-distance}px)`;
    viewport.dataset.position = String(Math.round(distance));
    viewport.dataset.side = x > 15 ? 'right' : 'left';
    const pair = Math.max(0, Math.min(5, Math.round((distance - 350) / 600)));
    positionLabel.textContent = `${['Audit', 'Redesign', 'Prototype', 'Guide'][weeks[pair * 2].stage]} · Weeks ${pair * 2 + 1} & ${pair * 2 + 2}`;
    const index = nearest();
    frames.forEach((frame, i) => { if (i === index) frame.dataset.near = 'true'; else delete frame.dataset.near; });
    jumps.forEach((anchor, i) => i === index ? anchor.setAttribute('aria-current', 'step') : anchor.removeAttribute('aria-current'));
    if (index !== suppressed) suppressed = -1;
    if (!busy) prompt.textContent = index < 0 ? 'Walk your student towards a door on either side.' : `Week ${index + 1} · ${weeks[index].title} — Enter to open`;
  };
  const populate = (index: number) => {
    const week = weeks[index];
    portal.dataset.stage = String(week.stage);
    portalTitle.textContent = week.title;
    root.querySelector('[data-portal-week]')!.textContent = `Week ${week.week} · ${['Audit', 'Redesign', 'Prototype', 'Guide'][week.stage]}`;
    root.querySelector('[data-portal-description]')!.textContent = week.description;
    root.querySelector('[data-portal-departure]')!.textContent = '';
    delete portal.dataset.leaving;
    links.replaceChildren(...week.links.map(link => {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      const label = document.createElement('strong'); label.textContent = `${link.label} →`;
      const title = document.createElement('span'); title.textContent = link.title;
      anchor.append(label, title);
      return anchor;
    }));
  };
  const enter = (index: number) => {
    if (busy || portal.open) return;
    stop(); busy = true; const current = ++token; opened = index; suppressed = index;
    populate(index);
    x = index % 2 ? 340 : -340;
    distance = depth(index);
    const transition = reduced.matches ? 'none' : 'transform 600ms cubic-bezier(.2,.7,.2,1)';
    world.style.transition = transition; student.style.transition = transition;
    face(index % 2 ? -90 : 90); settle(); render();
    student.dataset.state = reduced.matches ? 'idle' : 'walking';
    prompt.textContent = `Walking to Week ${index + 1} · ${weeks[index].title}…`;
    const show = () => {
      if (signal.aborted || current !== token) return;
      world.style.transition = ''; student.style.transition = ''; student.dataset.state = 'idle';
      busy = false; portal.showModal(); portalTitle.focus({ preventScroll: true });
    };
    if (reduced.matches) { frames[index].dataset.open = 'true'; show(); return; }
    later(() => {
      student.dataset.state = 'opening';
      prompt.textContent = `Opening the door to Week ${index + 1}…`;
    }, 600);
    later(() => { frames[index].dataset.open = 'true'; }, 850);
    later(() => {
      student.dataset.state = 'walking';
      x = index % 2 ? 455 : -455;
      // Keep the camera in the corridor while the student steps through.
      render();
    }, 1250);
    arrival = setTimeout(show, 1800);
  };
  const startDwell = () => {
    clearDwell();
    const index = nearest();
    if (!manual || keys.size || portal.open || busy || reduced.matches || index < 0 || index === suppressed || document.activeElement !== viewport || document.hidden) return;
    const started = performance.now();
    const announce = () => { prompt.textContent = `Week ${index + 1} · ${weeks[index].title} — entering in ${Math.max(1, Math.ceil((2000 - performance.now() + started) / 1000))}s. Move to cancel.`; };
    announce(); countdown = setInterval(announce, 500);
    dwell = setTimeout(() => { clearDwell(); if (nearest() === index && !keys.size && document.activeElement === viewport) enter(index); }, 2000);
  };
  const tick = (now: number) => {
    if (signal.aborted || reduced.matches || busy || portal.open) { raf = 0; return; }
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now;
    let dx = 0, dz = 0;
    keys.forEach(key => { if (forward.has(key)) dz++; if (backward.has(key)) dz--; if (left.has(key)) dx--; if (right.has(key)) dx++; });
    const norm = Math.hypot(dx, dz) || 1;
    x = Math.max(-315, Math.min(315, x + dx / norm * 260 * dt));
    distance = Math.max(80, Math.min(3800, distance + dz / norm * 340 * dt));
    if (dx || dz) face(-Math.atan2(dx, dz) * 180 / Math.PI);
    student.dataset.state = dx || dz ? 'walking' : 'idle';
    const follow = 1 - Math.exp(-10 * dt);
    cameraX += (x * .22 - cameraX) * follow;
    cameraDistance += (distance - cameraDistance) * follow;
    render();
    if (keys.size || Math.abs(cameraDistance - distance) + Math.abs(cameraX - x * .22) > .2) raf = requestAnimationFrame(tick);
    else { raf = 0; previous = 0; }
  };
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    const key = event.key.toLowerCase();
    if (movement.has(key) || key === ' ' || key === 'enter') event.preventDefault();
    if (key === 'enter' && nearest() >= 0) { enter(nearest()); return; }
    if (!movement.has(key) || reduced.matches || busy || portal.open) return;
    manual = true; clearDwell(); keys.add(key); world.style.transition = ''; student.style.transition = '';
    if (!raf) { previous = 0; raf = requestAnimationFrame(tick); }
  }, { signal });
  viewport.addEventListener('keyup', event => {
    if (event.target !== viewport) return;
    keys.delete(event.key.toLowerCase());
    if (!keys.size) { student.dataset.state = 'idle'; startDwell(); }
  }, { signal });
  viewport.addEventListener('pointerdown', event => { if (!(event.target as Element).closest('a')) viewport.focus({ preventScroll: true }); }, { signal });
  viewport.addEventListener('blur', () => { stop(); render(); }, { signal });
  viewport.addEventListener('focus', () => { if (reduced.matches) prompt.textContent = 'Choose a numbered door below to enter a week.'; }, { signal });
  root.querySelectorAll<HTMLAnchorElement>('[data-door], [data-jump]').forEach(anchor => {
    const index = Number(anchor.dataset.door ?? anchor.dataset.jump);
    anchor.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault(); enter(index);
    }, { signal });
    if (anchor.dataset.door !== undefined) anchor.addEventListener('focus', () => {
      if (busy || portal.open) return;
      x = index % 2 ? 220 : -220; distance = depth(index) - 180; face(0); settle(); render();
    }, { signal });
  });
  root.querySelector('[data-corridor-reset]')!.addEventListener('click', () => {
    stop(); token++; clearActions(); clearTimeout(arrival); busy = false; manual = false; suppressed = -1;
    frames.forEach(frame => delete frame.dataset.open); x = 0; distance = 120; face(0); settle(); student.style.transition = reduced.matches ? 'none' : 'transform 600ms ease';
    world.style.transition = reduced.matches ? 'none' : 'transform 600ms ease'; render(); viewport.focus({ preventScroll: true });
  }, { signal });
  root.querySelector('[data-corridor-close]')!.addEventListener('click', () => portal.close(), { signal });
  portal.addEventListener('close', () => {
    token++; clearActions(); clearTimeout(departure); clearTimeout(arrival); busy = false;
    if (opened >= 0) { delete frames[opened].dataset.open; x = opened % 2 ? 270 : -270; distance = depth(opened); face(0); settle(); }
    delete portal.dataset.leaving;
    if (!signal.aborted) { render(); viewport.focus({ preventScroll: true }); }
  }, { signal });
  links.addEventListener('click', event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a');
    if (!anchor || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault(); if (busy) return; busy = true;
    root.querySelector('[data-portal-departure]')!.textContent = `Entering ${anchor.querySelector('strong')!.textContent!.replace(' →', '')}…`;
    portal.dataset.leaving = 'true';
    departure = setTimeout(() => { if (!signal.aborted) void navigate(anchor.href); }, reduced.matches ? 0 : 240);
  }, { signal });
  window.addEventListener('blur', stop, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { signal });
  reduced.addEventListener('change', () => { stop(); token++; clearActions(); clearTimeout(arrival); busy = false; x = Math.max(-315, Math.min(315, x)); settle(); world.style.transition = ''; student.style.transition = ''; frames.forEach(frame => delete frame.dataset.open); render(); }, { signal });
  render(); root.dataset.ready = 'true';
  return () => { controller.abort(); stop(); token++; clearActions(); clearTimeout(arrival); clearTimeout(departure); if (portal.open) portal.close(); };
}
