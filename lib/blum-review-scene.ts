import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bindAventos, bindServoDrive, cadPart, disposeBlumModel, loadBlumModels } from './blum-cad';
import { bindSpaceTower } from './blum-space-tower';

export type BlumDemo = 'servo' | 'lift' | 'tower';
export type DemoPose = { door: number; drawers: number[]; inspect: boolean };
export type KitchenPose = { chapter: number; travel: number; firstApproach: number; doors: number[]; drawers: number[] };

const finishAssets = {
  limestone: 'kitchen-limestone.webp',
  plaster: 'kitchen-white_plaster_02-color.webp',
  plasterNormal: 'kitchen-white_plaster_02-normal.webp',
  floor: 'kitchen-wooden_floor_02-color.webp',
  floorNormal: 'kitchen-wooden_floor_02-normal.webp',
  garden: 'kitchen-studio-garden.hdr',
} as const;
type KitchenFinishes = Record<keyof typeof finishAssets, T.Texture>;

async function loadKitchenFinishes() {
  const loader = new T.TextureLoader();
  const hdr = new HDRLoader();
  const results = await Promise.allSettled(
    Object.entries(finishAssets).map(async ([key, filename]) => {
      const texture = await (key === 'garden' ? hdr : loader).loadAsync(`/assets/${filename}`);
      return [key, texture] as const;
    }),
  );
  const loaded = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    loaded.forEach(([, texture]) => texture.dispose());
    throw failed.reason;
  }
  return Object.fromEntries(loaded) as KitchenFinishes;
}

function createBlumScene(canvas: HTMLCanvasElement, demo: BlumDemo | 'kitchen', models: Partial<Record<BlumDemo, T.Group>>) {
  const kitchen = demo === 'kitchen';
  const touch = matchMedia('(any-pointer: coarse)').matches ||
    (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) <= 720);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: !kitchen, preserveDrawingBuffer: !kitchen });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const scene = new T.Scene();
  let environment: T.WebGLRenderTarget | undefined;
  const key = new T.DirectionalLight(0xffebd2, 2.1);
  key.position.set(-2, 5, 4);
  scene.add(key, new T.HemisphereLight(0xf3f5fa, 0x716657, 1.6));

  const camera = new T.PerspectiveCamera(36, 1, 0.05, 30);
  const assembly = new T.Group();
  let root = assembly;
  scene.add(assembly);
  const geometry = new Map<string, T.BufferGeometry>();
  const materials: T.Material[] = [];
  const surface = (color: number, roughness = 0.56, metalness = 0) => {
    const material = new T.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(material);
    return material;
  };
  const oak = surface(0xb08a62, 0.74);
  const woodGrain = document.createElement('canvas');
  woodGrain.width = 256;
  woodGrain.height = 256;
  const ink = woodGrain.getContext('2d');
  let woodTexture: T.CanvasTexture | undefined;
  if (ink) {
    ink.fillStyle = '#e3d7c1';
    ink.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 190; i++) {
      const x = i * 1.35;
      ink.strokeStyle = i % 3 === 0 ? '#58412a12' : '#fff7de22';
      ink.beginPath();
      ink.moveTo(x, 0);
      ink.bezierCurveTo(x + Math.sin(i) * 4, 82, x - Math.cos(i) * 3, 165, x + Math.sin(i / 2) * 3, 256);
      ink.stroke();
    }
    woodTexture = new T.CanvasTexture(woodGrain);
    woodTexture.colorSpace = T.SRGBColorSpace;
    oak.map = woodTexture;
  }
  const cream = surface(0xc7b89f, 0.46);
  const graphite = surface(0x333534, 0.68);
  const carbon = surface(0x252627, 0.56, 0.22);
  const steel = surface(0xaab2b4, 0.28, 0.78);
  const cap = surface(0x5a5c5c, 0.42);
  const generatedTextures: T.Texture[] = [];
  const controlPoints: T.Object3D[][] = [[], [], []];
  function controlPoint(parent: T.Object3D, group: number, x: number, y: number, z: number) {
    const point = new T.Object3D();
    point.position.set(x, y, z);
    parent.add(point);
    controlPoints[group].push(point);
  }

  const limestone = kitchen ? surface(0xe0dbd3, 0.73) : oak;
  const lacquer = kitchen ? surface(0xe4dcd0, 0.28) : cream;
  const countertop = kitchen ? surface(0xd8d4ca, 0.29) : cream;

  function box(parent: T.Object3D, material: T.Material, size: number[], position: number[], radius = 0.002) {
    const [width, height, depth] = size;
    const name = [...size, radius].join('/');
    let shape = geometry.get(name);
    if (!shape) {
      shape = radius ? new RoundedBoxGeometry(width, height, depth, 2, radius) : new T.BoxGeometry(width, height, depth);
      geometry.set(name, shape);
    }
    const mesh = new T.Mesh(shape, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = kitchen;
    mesh.receiveShadow = kitchen;
    parent.add(mesh);
    return mesh;
  }

  function cabinet(width: number, height: number, depth: number, material: T.Material) {
    const wall = 0.019;
    const sidePanels = [-1, 1].map(side => {
      box(root, material, [width - 2 * wall, wall, depth], [0, height / 2 + side * (height - wall) / 2, -depth / 2]);
      return box(root, material, [wall, height, depth], [side * (width - wall) / 2, height / 2, -depth / 2]);
    });
    box(root, graphite, [width - 2 * wall, height - 2 * wall, wall], [0, height / 2, -depth + wall / 2]);
    return sidePanels;
  }

  function drawerBox(drawer: T.Group, width: number, height: number, length: number, material: T.Material, sideWall: number, base = oak) {
    box(drawer, base, [width - 2 * sideWall, 0.016, length - 0.03], [0, 0.012, -length / 2]);
    box(drawer, material, [width - 2 * sideWall, height - 0.016, 0.016], [0, height / 2 + 0.008, -length + 0.01]);
    for (const sign of [-1, 1]) {
      box(drawer, material, [sideWall, height, length], [sign * (width - sideWall) / 2, height / 2, -length / 2]);
    }
  }

  function hardware(demo: BlumDemo) {
    const model = models[demo];
    if (!model) throw new Error('Blum CAD was not loaded for ' + demo);
    root.add(model);
    model.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const material = object.material as T.MeshStandardMaterial;
      object.castShadow = kitchen && !material.transparent;
      object.receiveShadow = kitchen;
      if (material.transparent) material.depthWrite = false;
    });
    return model;
  }

  function servo() {
    const [, rightPanel] = cabinet(0.84, 0.72, 0.58, graphite);
    box(root, countertop, [0.88, 0.032, 0.62], [0, 0.736, -0.285], 0.004);
    box(root, limestone, [0.832, 0.348, 0.021], [0, 0.18, 0.012]);
    const drawer = new T.Group();
    drawer.position.y = 0.401;
    drawerBox(drawer, 0.778, 0.21, 0.5, oak, 0.016);
    box(drawer, limestone, [0.832, 0.326, 0.022], [0, 0.129, 0.012]);
    controlPoint(drawer, 0, .09, .15, .03);
    root.add(drawer);
    // The vertical mounting profile belongs to the cabinet installation.
    box(root, graphite, [.033, .66, .017], [-.005, .36, -.553], .002);
    const move = bindServoDrive(hardware('servo'), drawer);
    return (pose: DemoPose) => {
      rightPanel.visible = !pose.inspect;
      move(pose.door);
    };
  }

  function lift() {
    const width = .9, height = .42;
    cabinet(width, height, .355, lacquer);
    const front = new T.Group();
    box(front, lacquer, [width - .004, height - .004, .019], [0, -height / 2, .019]);
    controlPoint(front, 1, .07, -.55 * height, .03);
    root.add(front);
    const right = hardware('lift');
    const leftCover = cadPart(right, 'CoverLeft');
    const rightCover = cadPart(right, 'CoverRight');
    const left = right.clone();
    // The compás and front plate are symmetric. Blum supplies each cover with its own handed geometry.
    cadPart(left, 'CoverLeft').removeFromParent();
    cadPart(left, 'CoverRight').removeFromParent();
    const coverMount = new T.Group();
    coverMount.scale.x = -1;
    coverMount.add(leftCover);
    left.add(coverMount);
    right.add(rightCover);
    const x = width / 2 - .019;
    right.position.set(x, height - .037, -.026);
    left.position.set(-x, height - .037, -.026);
    left.scale.x = -1;
    root.add(left);
    const moveRight = bindAventos(right, front, height);
    const moveLeft = bindAventos(left);
    return (pose: DemoPose) => {
      moveRight(pose.door);
      moveLeft(pose.door);
    };
  }

  function tower() {
    cabinet(.6, 1.99, .56, graphite);
    const { door, drawers, setPose } = bindSpaceTower(hardware('tower'));
    const grip = box(root, cap, [.009, .22, .016], [.248, 1.12, .026], .003);
    door.add(grip);
    controlPoint(door, 2, .212, 1.07, .04);
    drawers.forEach((drawer, i) => {
      controlPoint(drawer, 2, 0, [.119, .498, .818, 1.17, 1.448][i], .023);
    });
    return (pose: DemoPose) => setPose(pose.door, pose.drawers);
  }

  function resize(width: number, height: number) {
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    const pixelBudget = touch ? 850_000 : 4_000_000;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, touch ? 1.35 : 1.75,
      Math.sqrt(pixelBudget / Math.max(1, width * height))));
    renderer.setSize(width, height, false);
  }
  function dispose() {
    for (const shape of geometry.values()) shape.dispose();
    for (const material of materials) material.dispose();
    woodTexture?.dispose();
    generatedTextures.forEach(texture => texture.dispose());
    environment?.dispose();
    key.shadow.dispose();
    Object.values(models).forEach(disposeBlumModel);
    renderer.dispose();
  }

  function showKitchen(finishes: KitchenFinishes) {
    scene.background = new T.Color(0xd6c9b5);
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    key.intensity = 2.65;
    key.position.set(-4.8, 4, 1.1);
    key.castShadow = true;
    const shadowSize = touch ? 1024 : 2048;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.autoUpdate = false;
    key.shadow.needsUpdate = true;
    Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4, bottom: -4, near: .5, far: 13 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.normalBias = 0.006;
    key.shadow.bias = -0.0004;
    const wall = surface(0xcbbca8, .86);
    const backsplash = surface(0xa99c8c, .73);
    const plaster = surface(0xe1d9cd, 0.95);
    const ceiling = surface(0xf5f0e8, .93);
    ceiling.emissive.set(0xeee8df);
    ceiling.emissiveIntensity = .21;
    const floor = surface(0xe4ceb3, .57);
    const dark = surface(0x232522, 0.49);
    const bouncedDaylight = new T.PointLight(0xf9f0dd, 11, 6, 2);
    bouncedDaylight.position.set(-1.68, 1.55, -.37);
    scene.add(bouncedDaylight);
    const plant = surface(0x485637, 0.82);
    const ceramic = surface(0x857a55, 0.48);
    const warmLight = surface(0xffedbf, 0.45);
    warmLight.emissive.set(0xffc37a);
    warmLight.emissiveIntensity = 1.5;

    box(root, floor, [12, .08, 12], [0, -.04, 0], 0).castShadow = false;
    const contact = document.createElement('canvas');
    contact.width = contact.height = 128;
    const shade = contact.getContext('2d');
    if (shade) {
      const gradient = shade.createRadialGradient(64, 64, 9, 64, 64, 64);
      gradient.addColorStop(0, '#2b2116b0');
      gradient.addColorStop(0.42, '#2b21166e');
      gradient.addColorStop(1, '#2b211600');
      shade.fillStyle = gradient;
      shade.fillRect(0, 0, 128, 128);
      const map = new T.CanvasTexture(contact);
      generatedTextures.push(map);
      const material = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
      materials.push(material);
      for (const [x, z, width, depth] of [[-.22, .07, 1.84, 1.42], [-.84, -2.15, 4.6, .98], [1.82, -2.03, 2.5, 1.04]]) {
        const plane = new T.PlaneGeometry(width, depth);
        geometry.set(`contact-${x}`, plane);
        const shadow = new T.Mesh(plane, material);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(x, .001, z);
        root.add(shadow);
      }
    }
    box(root, wall, [7, 2.7, .13], [.48, 1.35, -2.71]);
    box(root, backsplash, [3.39, .735, .018], [-.83, 1.222, -2.631]);
    box(root, ceiling, [7, .11, 7.5], [.48, 2.746, 1.04]).castShadow = false;
    box(root, plaster, [.12, 2.7, 7.5], [3.1, 1.35, 1.04]).castShadow = false;
    box(root, plaster, [5.74, .045, .054], [.19, 2.672, -2.627], .003);
    box(root, plaster, [0.16, 2.7, .55], [-2.7, 1.35, -2.37]);
    box(root, plaster, [0.17, 2.7, 3.45], [-2.7, 1.35, 1.17]);
    box(root, plaster, [0.16, .23, 1.63], [-2.7, 2.58, -1.28]);
    box(root, plaster, [0.16, .75, 1.63], [-2.7, .375, -1.28]);
    const windowTrim = surface(0x69635a, .47, .28);
    for (const y of [.766, 2.45]) box(root, windowTrim, [.058, .043, 1.59], [-2.77, y, -1.28]);
    for (const z of [-2.061, -1.28, -.498]) box(root, windowTrim, [.058, 1.67, .037], [-2.77, 1.61, z]);
    box(root, countertop, [.32, .047, 1.70], [-2.701, .744, -1.28], .005);
    const pane = new T.MeshPhysicalMaterial({ color: 0xb6c5c1, metalness: .5, roughness: .14,
      transparent: true, opacity: .105, depthWrite: false });
    materials.push(pane);
    box(root, pane, [.008, 1.65, 1.54], [-2.79, 1.61, -1.28], 0).castShadow = false;
    const exterior = new T.MeshBasicMaterial({ color: 0xffffff, side: T.BackSide });
    materials.push(exterior);
    const domeShape = new T.SphereGeometry(26, 32, 20);
    geometry.set('garden-dome', domeShape);
    const dome = new T.Mesh(domeShape, exterior);
    dome.rotation.y = -.33;
    scene.add(dome);
    const trim = surface(0xc8c3b8, .5);
    const lampShape = new T.CylinderGeometry(.043, .043, .016, 18);
    const lensShape = new T.CylinderGeometry(.032, .032, .003, 18);
    geometry.set('ceiling-trim', lampShape);
    geometry.set('ceiling-lens', lensShape);
    for (const [x, z] of [[-1.84, -1.65], [-.72, -1.65], [.42, -1.65], [1.54, -1.65], [-.82, .54], [.65, .54]]) {
      const fixture = new T.Mesh(lampShape, trim);
      const lens = new T.Mesh(lensShape, warmLight);
      fixture.position.set(x, 2.689, z);
      lens.position.set(x, 2.678, z);
      root.add(fixture, lens);
    }

    const backZ = -2.02;
    box(root, graphite, [3.38, 0.77, 0.61], [-.83, .43, -2.34]);
    box(root, countertop, [3.41, .035, .66], [-.83, .838, -2.34], .005);
    box(root, countertop, [3.41, .048, .021], [-.83, .877, -2.616], .002);
    for (let column = 0; column < 6; column++) {
      const x = -2.235 + column * 0.563;
      box(root, limestone, [.555, .692, .024], [x, .438, backZ]);
    }
    box(root, dark, [3.38, .085, .58], [-.83, .042, -2.39]);

    for (let column = 0; column < 3; column++) {
      const x = -2.085 + column * .66;
      box(root, lacquer, [.652, .58, .36], [x, 1.84, -2.48], .003);
    }
    box(root, lacquer, [.898, .155, .355], [.015, 2.053, -2.48]);
    box(root, warmLight, [3.03, .007, .016], [-1.034, 1.546, -2.35]);
    for (const x of [-2, -1.25, -.5, .24]) {
      const led = new T.PointLight(0xffc389, 1.1, .95, 2);
      led.position.set(x, 1.48, -2.37);
      scene.add(led);
    }

    box(root, dark, [.53, .009, .33], [-1.44, .861, -2.34], .012);
    const faucetCurve = new T.CatmullRomCurve3([
      new T.Vector3(-1.44, .855, -2.53), new T.Vector3(-1.44, 1.025, -2.53),
      new T.Vector3(-1.44, 1.057, -2.46), new T.Vector3(-1.44, .994, -2.42),
    ]);
    const faucetShape = new T.TubeGeometry(faucetCurve, 24, .012, 8);
    geometry.set('faucet', faucetShape);
    const faucet = new T.Mesh(faucetShape, steel);
    faucet.castShadow = true;
    root.add(faucet);
    box(root, dark, [.51, .009, .36], [.27, .862, -2.32], .009);
    const cylinder = (material: T.Material, top: number, base: number, height: number, x: number, y: number, z: number) => {
      const shape = new T.CylinderGeometry(top, base, height, 20);
      geometry.set(`prop-${x}-${y}-${z}`, shape);
      const item = new T.Mesh(shape, material);
      item.position.set(x, y, z);
      item.castShadow = true;
      root.add(item);
    };
    cylinder(ceramic, .071, .059, .13, -2.14, .925, -2.29);
    const leafShape = new T.SphereGeometry(1, 8, 6);
    geometry.set('leaf', leafShape);
    for (let i = 0; i < 26; i++) {
      const angle = i * 2.39996;
      const distance = .025 + .0085 * (i % 13);
      const leaf = new T.Mesh(leafShape, plant);
      leaf.position.set(-2.14 + Math.cos(angle) * distance, 1.02 + i * .008, -2.29 + Math.sin(angle) * distance);
      leaf.scale.set(.017, .048, .008);
      leaf.rotation.z = Math.cos(angle) * .88;
      leaf.rotation.x = Math.sin(angle) * .88;
      root.add(leaf);
    }
    cylinder(ceramic, .032, .043, .15, .77, .93, -2.34);
    cylinder(carbon, .018, .018, .03, .77, 1.02, -2.34);
    cylinder(ceramic, .062, .04, .05, .72, .88, -2.27);
    for (const x of [1.79, 2.41]) box(root, graphite, [.603, 2.63, .58], [x, 1.315, -2.29]);
    box(root, graphite, [.597, .63, .58], [1.18, 2.31, -2.29]);

    // Batch opaque room meshes that share a material and shadow settings.
    // The door, drawers and hardware are added separately below.
    const batches = new Map<string, T.Mesh<T.BufferGeometry, T.Material>[]>();
    for (const object of assembly.children) {
      if (!(object instanceof T.Mesh) || Array.isArray(object.material) || object.material.transparent) continue;
      const key = [object.material.id, object.castShadow, object.receiveShadow].join('/');
      const meshes = batches.get(key) ?? [];
      meshes.push(object);
      batches.set(key, meshes);
    }
    for (const [key, meshes] of batches) {
      if (meshes.length < 2) continue;
      const parts = meshes.map(mesh => {
        mesh.updateMatrix();
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return geometry.applyMatrix4(mesh.matrix);
      });
      const combined = mergeGeometries(parts);
      parts.forEach(geometry => geometry.dispose());
      if (!combined) continue;
      geometry.set(`room-${key}`, combined);
      const batch = new T.Mesh(combined, meshes[0].material);
      batch.castShadow = meshes[0].castShadow;
      batch.receiveShadow = meshes[0].receiveShadow;
      assembly.remove(...meshes);
      assembly.add(batch);
    }

    const place = (create: () => (pose: DemoPose) => void, x: number, y: number, z: number, scale = 1) => {
      root = new T.Group();
      root.position.set(x, y, z);
      root.scale.setScalar(scale);
      assembly.add(root);
      return create();
    };
    const mechanisms = [
      place(servo, -.22, .06, .35, 1.13),
      place(lift, .015, 1.55, -2.302),
      place(tower, 1.18, 0, -1.998),
    ];
    root = assembly;
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    function tile(map: T.Texture, color: boolean, x: number, y: number, wrapping: T.Wrapping = T.RepeatWrapping) {
      map.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
      map.wrapS = map.wrapT = wrapping;
      map.repeat.set(x, y);
      map.anisotropy = anisotropy;
    }
    tile(finishes.limestone, true, 1, 1, T.MirroredRepeatWrapping);
    limestone.map = finishes.limestone;
    tile(finishes.plaster, true, 4, 2);
    tile(finishes.plasterNormal, false, 4, 2);
    for (const material of [wall, plaster, backsplash]) {
      material.map = finishes.plaster;
      material.normalMap = finishes.plasterNormal;
      material.normalScale.setScalar(.10);
    }
    tile(finishes.floor, true, 5, 5);
    tile(finishes.floorNormal, false, 5, 5);
    floor.map = finishes.floor;
    floor.normalMap = finishes.floorNormal;
    floor.normalScale.setScalar(.42);

    exterior.map = finishes.garden;
    const generator = new T.PMREMGenerator(renderer);
    environment = generator.fromEquirectangular(finishes.garden);
    generator.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = .32;
    const points = [
      { eye: new T.Vector3(1.83, 1.48, 3.65), look: new T.Vector3(-.26, 1.20, -1.12) },
      { eye: new T.Vector3(.91, 1.04, 2.18), look: new T.Vector3(-.23, .49, .08) },
      { eye: new T.Vector3(-.63, 1.57, -.44), look: new T.Vector3(.015, 1.81, -2.11) },
      { eye: new T.Vector3(2.14, 1.32, .85), look: new T.Vector3(1.04, 1.01, -1.8) },
    ];
    const look = new T.Vector3();
    const eye = new T.Vector3();
    const pose: DemoPose = { door: 0, drawers: [], inspect: false };

    const lastDoors = [-1, -1, -1];
    const lastDrawers = [0, 0, 0, 0, 0];
    let lastChapter = -1, lastAmount = -1, resized = true;

    function renderKitchen({ chapter, travel, firstApproach, doors, drawers }: KitchenPose) {
      const previous = Math.max(0, chapter - 1);
      const next = Math.max(1, chapter);
      const amount = chapter <= 1 ? firstApproach : travel;
      const cameraMoved = resized || lastChapter !== next || lastAmount !== amount;
      if (cameraMoved) {
        eye.lerpVectors(points[previous].eye, points[next].eye, amount);
        look.lerpVectors(points[previous].look, points[next].look, amount);
        camera.position.copy(eye);
        camera.lookAt(look);
        lastChapter = next;
        lastAmount = amount;
        resized = false;
      }
      const drawersMoved = drawers.some((value, i) => value !== lastDrawers[i]);
      let hardwareMoved = false;
      mechanisms.forEach((move, i) => {
        if (doors[i] === lastDoors[i] && (i !== 2 || !drawersMoved)) return;
        pose.door = doors[i];
        pose.drawers = drawers;
        move(pose);
        lastDoors[i] = doors[i];
        hardwareMoved = true;
      });
      if (drawersMoved) drawers.forEach((value, i) => { lastDrawers[i] = value; });
      if (hardwareMoved) key.shadow.needsUpdate = true;
      if (!cameraMoved && !hardwareMoved) return;
      renderer.render(scene, camera);
    }
    const projected = new T.Vector3();
    function projectControls(chapter: number) {
      return controlPoints[chapter - 1].map(point => {
        point.getWorldPosition(projected).project(camera);
        return { x: (projected.x + 1) * 50, y: (1 - projected.y) * 50 };
      });
    }
    function resizeKitchen(width: number, height: number) {
      camera.fov = 41 * Math.max(1, .88 / (width / Math.max(1, height))) ** .68;
      resize(width, height);
      resized = true;
    }
    return { resize: resizeKitchen, render: renderKitchen, projectControls, dispose: () => {
      Object.values(finishes).forEach(texture => texture.dispose());
      dispose();
    } };
  }

  function showDemo(selected: BlumDemo) {
    const generator = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .8;
    room.dispose();
    generator.dispose();
    const setPose = { servo, lift, tower }[selected]();
    const target = new T.Vector3(0, { servo: 0.37, lift: 0.30, tower: 1.01 }[selected], 0);
    const distance = { servo: 1.91, lift: 1.79, tower: 3.5 }[selected];
    const view = new T.Vector3(
      { servo: 0.56, lift: -0.52, tower: 0.62 }[selected],
      { servo: 0.33, lift: -0.20, tower: 0.16 }[selected], 1,
    ).normalize();
    const inspectView = new T.Vector3(1, 0.10, 0.53).normalize();
    function render(pose: DemoPose) {
      setPose(pose);
      camera.position.copy(target).addScaledVector(pose.inspect ? inspectView : view,
        distance * Math.max(1, 0.98 / camera.aspect));
      camera.lookAt(target);
      renderer.render(scene, camera);
    }
    return { resize, render, dispose };
  }

  return { showKitchen, showDemo, dispose };
}

export async function mountBlumDemo(canvas: HTMLCanvasElement, demo: BlumDemo) {
  const models = await loadBlumModels([demo]);
  try { return createBlumScene(canvas, demo, models).showDemo(demo); }
  catch (error) { Object.values(models).forEach(disposeBlumModel); throw error; }
}

export async function mountKitchen(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const [models, finishes] = await Promise.allSettled([
    loadBlumModels(['servo', 'lift', 'tower']),
    loadKitchenFinishes(),
  ]);
  if (signal.aborted || models.status === 'rejected' || finishes.status === 'rejected') {
    if (models.status === 'fulfilled') Object.values(models.value).forEach(disposeBlumModel);
    if (finishes.status === 'fulfilled') Object.values(finishes.value).forEach(texture => texture.dispose());
    if (signal.aborted) return;
    if (models.status === 'rejected') throw models.reason;
    if (finishes.status === 'rejected') throw finishes.reason;
    return;
  }
  let scene: ReturnType<typeof createBlumScene> | undefined;
  try {
    scene = createBlumScene(canvas, 'kitchen', models.value);
    return scene.showKitchen(finishes.value);
  } catch (error) {
    if (scene) scene.dispose();
    else Object.values(models.value).forEach(disposeBlumModel);
    Object.values(finishes.value).forEach(texture => texture.dispose());
    throw error;
  }
}
