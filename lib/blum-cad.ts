import { Group, Mesh, Object3D, Vector2, Vector3 } from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { BlumDemo } from './blum-review-scene';

const cadAssets = {
  servo: 'servo-drive',
  lift: 'aventos-hk-top',
  tower: 'space-tower',
};

async function loadCad(loader: GLTFLoader, demo: BlumDemo) {
  const path = `/assets/blum-${cadAssets[demo]}.glb`;
  if (demo === 'tower' && typeof DecompressionStream === 'function') {
    try {
      const response = await fetch(`${path}.gz`);
      if (response.ok && response.body) {
        const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
        const bytes = await new Response(stream).arrayBuffer();
        return await loader.parseAsync(bytes, '/assets/');
      }
    } catch {
      // Use the original GLB if the compressed asset cannot be read.
    }
  }
  return loader.loadAsync(path);
}

export async function loadBlumModels(demos: BlumDemo[]) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const models: Partial<Record<BlumDemo, Group>> = {};
  const results = await Promise.allSettled(demos.map(async demo => {
    const { scene } = await loadCad(loader, demo);
    models[demo] = scene;
  }));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    Object.values(models).forEach(disposeBlumModel);
    throw failed.reason;
  }
  return models;
}

export function cadPart(model: Group, name: string) {
  const object = model.getObjectByName(name);
  if (!object) throw new Error(`Missing CAD component: ${name}`);
  return object;
}

export function disposeBlumModel(model: Group) {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Exclude<Mesh['material'], unknown[]>>();
  model.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of [object.material].flat()) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export function bindAventos(model: Group, front?: Group, height = 0) {
  const main = cadPart(model, 'MainArm');
  const rocker = cadPart(model, 'Rocker');
  const coupler = cadPart(model, 'Coupler');
  const secondary = cadPart(model, 'SecondaryArm');
  const frontLink = cadPart(model, 'FrontLink');
  const bracket = cadPart(model, 'FrontBracket');

  // Y/Z coordinates of the seven pin axes in the STEP, in meters.
  const pin = (y: number, z: number) => new Vector2(y / 1000, z / 1000);
  const mainBase = pin(2, -16);
  const rockerBase = pin(8.16, 24.96);
  const mainJoint = pin(-57.4, -40.92);
  const secondaryJoint = pin(-92.14, -45.92);
  const rockerJoint = pin(-42.43, -4.86);
  const frontJoint = pin(-1.21, 26.5);
  const frontLower = pin(-31.06, 20.12);
  const frontTop = pin(36, 20);

  const movedMain = new Vector2();
  const movedSecondary = new Vector2();
  const movedRocker = new Vector2();
  const movedFront = new Vector2();
  const movedLower = new Vector2();
  const delta = new Vector2();
  const position = new Vector2();
  const angle = (a: Vector2, b: Vector2) => Math.atan2(b.y - a.y, b.x - a.x);
  const rockerLength = rockerBase.distanceTo(rockerJoint);
  const couplerLength = mainJoint.distanceTo(rockerJoint);
  const secondaryLength = secondaryJoint.distanceTo(frontLower);
  const frontLength = frontJoint.distanceTo(frontLower);

  function intersect(a: Vector2, b: Vector2, firstLength: number, secondLength: number, branch: number, result: Vector2) {
    delta.subVectors(b, a);
    const reach = delta.length();
    const along = (firstLength ** 2 - secondLength ** 2 + reach ** 2) / (2 * reach);
    const offset = branch * Math.sqrt(Math.max(0, firstLength ** 2 - along ** 2));
    return result.set(a.x + (delta.x * along - delta.y * offset) / reach,
      a.y + (delta.y * along + delta.x * offset) / reach);
  }

  const origin = new Vector2();
  function place(object: Object3D, from: Vector2, to: Vector2, rotation: number) {
    position.copy(from).rotateAround(origin, rotation).negate().add(to);
    object.position.set(0, position.x, position.y);
    object.rotation.x = rotation;
  }

  return (amount: number) => {
    // An 87.993° main-arm rotation produces a 107° opening at the front.
    const swing = -87.993 * Math.PI / 180 * amount;
    movedMain.copy(mainJoint).rotateAround(mainBase, swing);
    movedSecondary.copy(secondaryJoint).rotateAround(mainBase, swing);
    intersect(rockerBase, movedMain, rockerLength, couplerLength, -1, movedRocker);
    const couplerTurn = angle(movedMain, movedRocker) - angle(mainJoint, rockerJoint);
    movedFront.copy(frontJoint).sub(mainJoint).rotateAround(origin, couplerTurn).add(movedMain);
    intersect(movedSecondary, movedFront, secondaryLength, frontLength, 1, movedLower);
    const frontTurn = angle(movedFront, movedLower) - angle(frontJoint, frontLower);

    place(main, mainBase, mainBase, swing);
    place(rocker, rockerBase, rockerBase, angle(rockerBase, movedRocker) - angle(rockerBase, rockerJoint));
    place(coupler, mainJoint, movedMain, couplerTurn);
    place(secondary, secondaryJoint, movedSecondary, angle(movedSecondary, movedLower) - angle(secondaryJoint, frontLower));
    place(frontLink, frontJoint, movedFront, frontTurn);
    place(bracket, frontJoint, movedFront, frontTurn);
    if (front) {
      position.copy(frontTop).sub(frontJoint).rotateAround(origin, frontTurn).add(movedFront);
      front.position.set(0, height - .037 + position.x, -.026 + position.y);
      front.rotation.x = frontTurn;
    }
  };
}

export function bindServoDrive(model: Group, drawer: Group) {
  const frontInset = -.035;
  const rails = ['Left', 'Right'].map((side, i) => {
    const x = i === 0 ? -.401 : .401;
    const fixed = cadPart(model, side + 'Fixed');
    const sliding = cadPart(model, side + 'Sliding');
    const intermediate = cadPart(model, side + 'Intermediate');
    for (const rail of [fixed, sliding, intermediate]) {
      rail.position.set(x, drawer.position.y + .003, frontInset);
    }
    return { intermediate, sliding };
  });
  const drive = new Group();
  drive.position.set(.03, drawer.position.y + .022, -.517);
  drive.rotation.y = Math.PI;
  const lever = cadPart(model, 'Lever');
  drive.add(cadPart(model, 'DriveUnit'), lever);
  model.add(drive);
  const pin = new Vector3(-.010, 0, .014);
  const axis = new Vector3(0, 1, 0);
  let previous = 0;
  let opening = false;

  return (amount: number) => {
    // Simulate the small press before the release. The two rails extend with the drawer.
    if (amount !== previous) opening = amount > previous;
    previous = amount;
    const release = .12;
    drawer.position.z = amount < release
      ? (opening ? -.002 * Math.sin(Math.PI * amount / release) : 0)
      : .5 * (amount - release) / (1 - release);
    for (const { intermediate, sliding } of rails) {
      sliding.position.z = frontInset + drawer.position.z;
      intermediate.position.z = frontInset + Math.max(0, drawer.position.z / 2);
    }
    const stroke = opening ? Math.max(0, 1 - Math.abs(amount - .19) / .15) : 0;
    lever.rotation.y = .57 * stroke;
    lever.position.copy(pin).applyAxisAngle(axis, lever.rotation.y).negate().add(pin);
  };
}
