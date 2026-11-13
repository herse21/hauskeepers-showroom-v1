'use client';

import { useEffect, useRef, useState } from 'react';
import type { BlumDemo, DemoPose } from '../lib/blum-review-scene';

const references = {
  servo: {
    title: 'SERVO-DRIVE',
    label: 'CAD oficial de Blum · SERVO-DRIVE y MOVENTO',
    description: 'Un toque en el frente activa el expulsor trasero. Las dos guías de extracción van debajo de la caja de madera.',
    action: 'cajón',
    source: 'https://www.blum.com/mx/es/products/runnersystems/movento/assembly/',
    previous: '/assets/kitchen-servo-drive-v8-720p.mp4',
  },
  lift: {
    title: 'AVENTOS HK top',
    label: 'CAD oficial de Blum · AVENTOS HK top',
    description: 'Los mecanismos van en los dos costados interiores. Los brazos se articulan con el frente, que gira hacia arriba hasta 107° en esta vista.',
    action: 'frente',
    source: 'https://www.blum.com/mx/es/products/liftsystems/aventos-hk-top/assembly/',
    previous: '/assets/kitchen-aventos-v8-720p.mp4',
  },
  tower: {
    title: 'SPACE TOWER',
    label: 'CAD oficial de Blum · LEGRABOX',
    description: 'La configuración de referencia de Blum tiene un cajón bajo, cuatro extraíbles altos con inserto y bisagras CLIP top BLUMOTION. La puerta abre antes que los cajones.',
    action: 'puerta',
    source: 'https://d2.blum.com/services/BEC003/me188317_ep_dok_bau_%24ses-mx_%24aof_%24v1.pdf',
    previous: '/assets/kitchen-space-tower-v9-720p.mp4',
  },
};
const demos = Object.keys(references) as BlumDemo[];
const drawerNames = ['Inferior C', 'Segundo C', 'Central C', 'Cuarto C', 'Superior M'];
const closedDrawers = () => [false, false, false, false, false];
const closedPose = (): DemoPose => ({ door: 0, drawers: [0, 0, 0, 0, 0], inspect: false });

function DemoCanvas({ demo, door, drawers, inspect, onReady }: {
  demo: BlumDemo;
  door: boolean;
  drawers: boolean[];
  inspect: boolean;
  onReady: (ready: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const targets = useRef({ door, drawers, inspect });
  const wake = useRef<() => void>(() => {});
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    targets.current = { door, drawers, inspect };
    wake.current();
  }, [door, drawers, inspect]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = true, request = 0;
    let teardown: (() => void) | undefined;

    import('../lib/blum-review-scene').then(async ({ mountBlumDemo }) => {
      if (!active) return;
      const viewer = await mountBlumDemo(node, demo);
      if (!active) { viewer.dispose(); return; }
      const pose = closedPose();
      let lastTime = 0;
      const approach = (from: number, to: number, dt: number) => {
        const difference = to - from;
        return motion.matches || Math.abs(difference) < 0.001 ? to : from + difference * (1 - Math.exp(-8 * dt));
      };
      function animate(now: number) {
        request = 0;
        const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
        lastTime = now;
        const target = targets.current;
        pose.inspect = target.inspect;
        const tower = demo === 'tower';
        const canMoveDrawers = tower && target.door && pose.door >= 0.997;
        const drawerTargets = target.drawers.map(open => Number(canMoveDrawers && open));
        pose.drawers = pose.drawers.map((value, i) => approach(value, drawerTargets[i], dt));
        const holdDoor = tower && pose.drawers.some(value => value > 0);
        pose.door = approach(pose.door, Number(target.door || holdDoor), dt);
        viewer.render(pose);
        if (pose.door !== Number(target.door) || pose.drawers.some((value, i) => value !== Number(tower && target.door && target.drawers[i]))) {
          request = window.requestAnimationFrame(animate);
        } else {
          lastTime = 0;
        }
      }
      wake.current = () => {
        if (!request) request = window.requestAnimationFrame(animate);
      };
      const resize = () => {
        viewer.resize(node.clientWidth, node.clientHeight);
        wake.current();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(node);
      motion.addEventListener('change', wake.current);
      const contextLost = () => {
        if (request) window.cancelAnimationFrame(request);
        request = 0;
        teardown?.();
        teardown = undefined;
        wake.current = () => {};
        onReady(false);
        setUnavailable(true);
      };
      node.addEventListener('webglcontextlost', contextLost, { once: true });
      teardown = () => {
        observer.disconnect();
        motion.removeEventListener('change', wake.current);
        node.removeEventListener('webglcontextlost', contextLost);
        viewer.dispose();
      };
      resize();
      onReady(true);
    }).catch(() => {
      if (active) setUnavailable(true);
    });

    return () => {
      active = false;
      if (request) window.cancelAnimationFrame(request);
      teardown?.();
      wake.current = () => {};
    };
  }, [demo, onReady]);

  return <>
    <canvas ref={canvas} aria-hidden="true" className="blum-review-canvas" />
    {unavailable && <p className="blum-review-error" role="status">La vista 3D requiere WebGL. Puedes consultar la referencia de Blum o ver el clip anterior.</p>}
  </>;
}

export function BlumReview() {
  const [demo, setDemo] = useState<BlumDemo>('servo');
  const [door, setDoor] = useState(false);
  const [drawers, setDrawers] = useState(closedDrawers);
  const [ready, setReady] = useState(false);
  const [compare, setCompare] = useState(false);
  const [inspect, setInspect] = useState(false);
  const current = references[demo];

  function select(next: BlumDemo) {
    if (next === demo) return;
    setDemo(next);
    setDoor(false);
    setDrawers(closedDrawers());
    setInspect(false);
    setReady(false);
  }

  return <section className="blum-review" aria-labelledby="blum-review-title">
    <div className="blum-review-top">
      <div>
        <a href="/">← Volver al showroom</a>
        <h1 id="blum-review-title">Herrajes Blum en 3D</h1>
      </div>
      <p>Herrajes de referencia de Blum E-SERVICES con movimiento interactivo en Three.js.</p>
    </div>
    <nav className="blum-review-products" aria-label="Demostraciones Blum">
      {demos.map(key => <button key={key} type="button" aria-pressed={key === demo} onClick={() => select(key)}>{references[key].title}</button>)}
    </nav>
    <div className="blum-review-layout">
      <div className="blum-review-stage">
        <DemoCanvas key={demo} demo={demo} door={door} drawers={drawers} inspect={inspect} onReady={setReady} />
        <span className="blum-review-caption">{current.label}</span>
      </div>
      <div className="blum-review-details">
        <h2>{current.title}</h2>
        <p>{current.description}</p>
        <div className="blum-review-controls">
          <button type="button" className="blum-review-primary" disabled={!ready} aria-pressed={door} onClick={() => {
            if (door) setDrawers(closedDrawers());
            setDoor(!door);
          }}>{door ? 'Cerrar' : demo === 'servo' ? 'Tocar para abrir' : 'Abrir'} {demo === 'tower' ? 'la' : 'el'} {current.action}</button>
          {demo === 'servo' && <button className="blum-review-secondary" type="button" aria-pressed={inspect}
            disabled={!ready} onClick={() => setInspect(!inspect)}>{inspect ? 'Ver gabinete completo' : 'Ver guías y expulsor'}</button>}
          {demo === 'tower' && <div className="blum-review-drawers" role="group" aria-label="Cajones interiores">
            {drawerNames.map((name, index) => <button type="button" key={name} disabled={!ready || !door}
              aria-pressed={drawers[index]} onClick={() => setDrawers(previous => previous.map((open, i) => i === index && !open))}>
              {name}
            </button>)}
          </div>}
        </div>
        <a className="blum-review-source" href={current.source} target="_blank" rel="noreferrer">Referencia oficial de Blum ↗</a>
        <button type="button" className="blum-review-compare" aria-expanded={compare} aria-controls="blum-previous" onClick={() => setCompare(!compare)}>{compare ? 'Ocultar video anterior' : 'Comparar con el video anterior'}</button>
      </div>
    </div>
    <div id="blum-previous" className="blum-review-previous" hidden={!compare}>
      {compare && <video key={demo} src={current.previous} controls muted playsInline preload="metadata" aria-label={`Video anterior de ${current.title}`} />}
    </div>
  </section>;
}
