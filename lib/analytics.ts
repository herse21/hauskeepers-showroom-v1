export type ShowroomEvent = { event: string; section?: string; solution?: string; brand?: string; [key: string]: unknown };
declare global { interface Window { dataLayer?: ShowroomEvent[]; } }
export function track(event: ShowroomEvent) {
  if (typeof window === 'undefined') return;
  const payload = { ...event, page: window.location.pathname, timestamp: new Date().toISOString() };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent('hauskeepers:analytics', { detail: payload }));
}
export function whatsappUrl(phone: string, section: string, solution?: string, brand?: string, extra?: string) {
  const context = solution ? `la solución ${solution}${brand && brand !== solution ? ` de ${brand}` : ''}` : `la sección ${section}`;
  const message = `Hola, estoy viendo ${context} en el showroom digital de Hauskeepers y quisiera asesoría para mi proyecto.${extra ? ` ${extra}` : ''}\n\nOrigen: showroom digital · ${section}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
