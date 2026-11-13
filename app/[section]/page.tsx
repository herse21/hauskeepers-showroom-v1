import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PremiumCollection } from '../../components/premium-home';
import { sections } from '../../lib/content';

export function generateStaticParams() { return [...sections, 'privacidad'].map(section => ({ section })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const titles: Record<string, string> = { soluciones: 'Soluciones', inspiracion: 'Inspiración', marcas: 'Marcas', profesionales: 'Profesionales', showroom: 'Visita el showroom', privacidad: 'Privacidad' };
  return { title: titles[section], alternates: { canonical: `/${section}` } };
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (![...sections, 'privacidad'].includes(section as typeof sections[number])) notFound();
  if (section === 'privacidad') return <article className="legal section-pad"><span className="eyebrow">HAUSKEEPERS / PRIVACIDAD</span><h1>Tu visita.<br />Tu información.</h1><p>Esta versión del showroom no solicita datos personales mediante formularios ni utiliza cookies publicitarias. Los controles de navegación y de exploración funcionan en tu navegador.</p><h2>Contacto por WhatsApp</h2><p>Al elegir una consulta, se abre WhatsApp con un mensaje que incluye el producto o la marca de interés cuando se ha seleccionado uno. El mensaje se envía únicamente cuando tú decides hacerlo. WhatsApp y los demás servicios externos se rigen por sus propias políticas.</p><h2>Medición de uso</h2><p>La V1 prepara eventos de interacción en el navegador. No tiene conectado un proveedor externo de analítica. El alojamiento puede procesar registros técnicos necesarios para entregar el sitio. Cualquier futura medición o captura de datos debe acompañarse del aviso y los controles correspondientes.</p><h2>Imágenes y marcas</h2><p>La cocina interactiva y sus animaciones son ilustraciones conceptuales generadas con IA para este recorrido; no son grabaciones del showroom ni demostraciones certificadas de modelos comerciales. Las fotografías de producto pertenecen a los fabricantes indicados y son referencias de inspiración, no obras ni el local físico de Hauskeepers. Los nombres de marca identifican líneas de soluciones. Las configuraciones y disponibilidad deben consultarse con un asesor.</p><p><a href="https://www.rehau.com/mx-es/rauvisio-brilliant-mx" target="_blank" rel="noopener noreferrer">Referencia de superficies · REHAU</a></p><p>Consulta actualizada: 11 de noviembre de 2026.</p><Link className="text-link" href="/">Volver al recorrido →</Link></article>;
  return <PremiumCollection type={section as typeof sections[number]} />;
}
