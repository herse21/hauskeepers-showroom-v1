import initial from '../public/content/showroom.json';
export const content = initial;
export type Content = typeof initial;
export type Solution = Content['solutions'][number];
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hauskeepers-showroom-v1.vercel.app';
export const sections = ['soluciones', 'inspiracion', 'marcas', 'profesionales', 'showroom'] as const;
export const sectionTitles: Record<string, string> = { soluciones: 'Una idea. Muchas posibilidades.', inspiracion: 'Empieza por tu espacio.', marcas: 'El detalle tiene un origen.', profesionales: 'Tu idea merece una buena solución.', showroom: 'Hay cosas que tienes que abrir para entender.' };
