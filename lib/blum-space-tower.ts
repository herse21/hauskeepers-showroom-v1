import { Group, Mesh, Object3D, Vector3 } from 'three';
import { cadPart as part } from './blum-cad';

export function bindSpaceTower(model: Group) {
  // Keep the GLB's dequantization transforms inside each animated pivot.
  const pivotPart = (object: Object3D) => {
    const pivot = new Group();
    object.parent?.add(pivot);
    pivot.add(object);
    return pivot;
  };
  const door = pivotPart(part(model, 'Door'));
  const drawers = Array.from({ length: 5 }, (_, i) => part(model, `Drawer${i}`));
  const slides = drawers.map((_, i) => pivotPart(part(model, `Slide${i}`)));
  const template = Array.from({ length: 7 }, (_, i) => part(model, `HingePart${i}`));
  const hingeHeights = [.280, .670, 1.340, 1.910];
  const hinges = hingeHeights.map(height => template.map(mesh => {
    const link = new Group();
    link.add(mesh.clone());
    link.position.y = height;
    model.add(link);
    return link;
  }));
  template.forEach(mesh => mesh.removeFromParent());

  // Pivot centers measured from the cylindrical faces in the Blum STEP.
  // They are in the exported model's X/Z plane, in meters.
  const pivot = (x: number, z: number) => new Vector3((x + 281) / 1000, 0, z / 1000);
  const mainBase = pivot(-532.195, -68.72);
  const mainDoor = pivot(-567.5, 4.7);
  const secondDoor = pivot(-543.85, 3.5);
  const secondBase = pivot(-557.02, -.52);
  const middle = pivot(-511.475, -26.86);
  const initialMainAngle = Math.atan2(mainDoor.z - mainBase.z, mainDoor.x - mainBase.x);
  const mainTravel = 140 * Math.PI / 180 - initialMainAngle;
  const firstLength = secondBase.distanceTo(middle);
  const secondLength = middle.distanceTo(secondDoor);
  const branch = Math.sign((secondDoor.x - secondBase.x) * (middle.z - secondBase.z)
    - (secondDoor.z - secondBase.z) * (middle.x - secondBase.x));
  const axis = new Vector3(0, 1, 0);
  const movedMain = new Vector3(), movedSecond = new Vector3(), movedMiddle = new Vector3();
  const delta = new Vector3(), original = new Vector3();
  const angle = (from: Vector3, to: Vector3) => Math.atan2(to.z - from.z, to.x - from.x);

  function place(object: Object3D, rest: Vector3, target: Vector3, rotation: number, height: number) {
    object.rotation.y = rotation;
    object.position.copy(target).sub(original.copy(rest).applyAxisAngle(axis, rotation));
    object.position.y = height;
  }

  function setPose(opening: number, extensions: number[]) {
    const rotation = -155 * Math.PI / 180 * opening;
    const swing = mainTravel * opening;
    movedMain.copy(mainDoor).sub(mainBase).applyAxisAngle(axis, -swing).add(mainBase);
    movedSecond.copy(secondDoor).sub(mainDoor).applyAxisAngle(axis, rotation).add(movedMain);
    delta.subVectors(movedSecond, secondBase);
    const reach = delta.length();
    const along = (reach ** 2 + firstLength ** 2 - secondLength ** 2) / (2 * reach);
    const offset = branch * Math.sqrt(Math.max(0, firstLength ** 2 - along ** 2));
    movedMiddle.set(secondBase.x + (delta.x * along - delta.z * offset) / reach, 0,
      secondBase.z + (delta.z * along + delta.x * offset) / reach);
    const cupLink = angle(secondDoor, middle) - angle(movedSecond, movedMiddle);
    const baseLink = angle(secondBase, middle) - angle(secondBase, movedMiddle);
    place(door, mainDoor, movedMain, rotation, 0);
    hinges.forEach((pieces, i) => {
      const height = hingeHeights[i];
      place(pieces[2], mainDoor, movedMain, rotation, height);
      place(pieces[3], secondDoor, movedSecond, cupLink, height);
      place(pieces[5], mainBase, mainBase, -swing, height);
      place(pieces[6], secondBase, secondBase, baseLink, height);
    });
    drawers.forEach((drawer, i) => {
      drawer.position.z = .465 * extensions[i];
      slides[i].position.z = drawer.position.z / 2;
    });
  }
  return { door, drawers, setPose };
}
