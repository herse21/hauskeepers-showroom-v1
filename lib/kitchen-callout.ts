type Point = { x: number; y: number };
export type CalloutRect = { left: number; top: number; right: number; bottom: number };
export type CalloutAnchor = Point & { exit: 'left' | 'right' | 'down' };

const clamp = (value: number, start: number, end: number) => Math.max(start, Math.min(end, value));
const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

function crosses(a: Point, b: Point, rect: CalloutRect) {
  return Math.min(a.x, b.x) < rect.right && Math.max(a.x, b.x) > rect.left
    && Math.min(a.y, b.y) < rect.bottom && Math.max(a.y, b.y) > rect.top;
}

function simplify(points: Point[]) {
  const route: Point[] = [];
  for (const point of points) {
    const last = route[route.length - 1], previous = route[route.length - 2];
    if (last && distance(last, point) < .01) continue;
    if (previous && (previous.x === last.x && last.x === point.x || previous.y === last.y && last.y === point.y)) {
      if (distance(previous, point) < distance(previous, last) + distance(last, point) - .01) return null;
      route.pop();
    }
    route.push(point);
  }
  return route;
}

function roundPath(points: Point[]) {
  const first = points[0];
  let path = `M${first.x},${first.y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = points[i - 1], corner = points[i], next = points[i + 1];
    const incoming = distance(corner, previous), outgoing = distance(corner, next);
    const radius = Math.min(10, incoming / 2, outgoing / 2);
    const before = { x: corner.x + (previous.x - corner.x) * radius / incoming, y: corner.y + (previous.y - corner.y) * radius / incoming };
    const after = { x: corner.x + (next.x - corner.x) * radius / outgoing, y: corner.y + (next.y - corner.y) * radius / outgoing };
    path += ` L${before.x},${before.y} Q${corner.x},${corner.y} ${after.x},${after.y}`;
  }
  const end = points[points.length - 1], previous = points[points.length - 2];
  const length = distance(previous, end);
  const dx = (end.x - previous.x) / length, dy = (end.y - previous.y) / length;
  return `${path} L${end.x},${end.y} M${end.x - dx * 8 - dy * 4},${end.y - dy * 8 + dx * 4} L${end.x},${end.y} L${end.x - dx * 8 + dy * 4},${end.y - dy * 8 - dx * 4}`;
}

export function kitchenCalloutPath(anchors: CalloutAnchor[], movingFront: CalloutRect, origin: Point, panel: CalloutRect, button: CalloutRect | null, width: number, height: number) {
  const obstacles = [movingFront, panel, ...(button ? [button] : [])].map((rect, index) => {
    const clearance = index === 0 ? 4 : 8;
    return { left: rect.left - clearance, right: rect.right + clearance, top: rect.top - clearance, bottom: rect.bottom + clearance };
  });
  let best: Point[] | null = null;
  let bestLength = Infinity;

  anchors.forEach((start, index) => {
    for (const clearance of [18, 8]) {
      const lead = { x: start.x + (start.exit === 'left' ? -clearance : start.exit === 'right' ? clearance : 0), y: start.y + (start.exit === 'down' ? clearance : 0) };
      for (const shift of [0, 28, -28]) {
        const targetY = clamp(lead.y + shift, panel.top + 32, panel.bottom - 32);
        const targetX = clamp(lead.x + shift, panel.left + 34, panel.right - 34);
        const entries = [
          { x: panel.left - 14, y: targetY, dx: -clearance, dy: 0 },
          { x: panel.right + 14, y: targetY, dx: clearance, dy: 0 },
          { x: targetX, y: panel.top - 14, dx: 0, dy: -clearance },
        ];
        for (const end of entries) {
          const approach = { x: end.x + end.dx, y: end.y + end.dy };
          for (const elbow of [{ x: approach.x, y: lead.y }, { x: lead.x, y: approach.y }]) {
            const points = simplify([start, lead, elbow, approach, end]);
            if (!points || points.some(point => point.x < 12 || point.x > width - 12 || point.y < 72 || point.y > height - 12)) continue;
            if (points.some((point, i) => i > 0 && obstacles.some(rect => crosses(points[i - 1], point, rect)))) continue;
            const length = points.reduce((sum, point, i) => i === 0 ? sum : sum + distance(points[i - 1], point), index * 72 + distance(start, origin) * .2);
            if (length < bestLength) { best = points; bestLength = length; }
          }
        }
      }
    }
  });
  return best ? roundPath(best) : '';
}
