export type ShowroomEvent = { event: string; section?: string; solution?: string; brand?: string; [key: string]: unknown };
declare global { interface Window { dataLayer?: ShowroomEvent[]; } }
export function track(event: ShowroomEvent) {
  if (typeof window === 'undefined') return;
  const payload = { ...event, page: window.location.pathname, timestamp: new Date().toISOString() };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent('hauskeepers:analytics', { detail: payload }));
}
export function whatsappUrl(phone: string, _section: string, solution?: string, brand?: string, extra?: string) {
  const context = solution
    ? `Hola, me interesa ${solution}${brand && brand !== solution ? ` de ${brand}` : ''}. Quisiera una cotización para mi proyecto.`
    : brand
      ? `Hola, quisiera conocer las opciones de ${brand} para mi proyecto.`
      : 'Hola, quisiera asesoría para mi proyecto.';
  const message = extra ? `${context} ${extra}` : context;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
