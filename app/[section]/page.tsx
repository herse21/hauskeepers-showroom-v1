import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Brands, Inspiration, Professionals, Showroom, SolutionsIndex } from '../../components/experience';
import { sections, sectionTitles } from '../../lib/content';

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
  if (section === 'privacidad') return <article className="legal section-pad"><span className="eyebrow">HAUSKEEPERS / PRIVACIDAD</span><h1>Tu visita.<br />Tu información.</h1><p>Esta versión del showroom no solicita datos personales mediante formularios ni utiliza cookies publicitarias. Los controles de navegación y de exploración funcionan en tu navegador.</p><h2>Contacto por WhatsApp</h2><p>Al elegir una consulta, se abre WhatsApp con un mensaje que incluye la sección o solución de interés. El mensaje se envía únicamente cuando tú decides hacerlo. WhatsApp y los demás servicios externos se rigen por sus propias políticas.</p><h2>Medición de uso</h2><p>La V1 prepara eventos de interacción en el navegador. No tiene conectado un proveedor externo de analítica. El alojamiento puede procesar registros técnicos necesarios para entregar el sitio. Cualquier futura medición o captura de datos debe acompañarse del aviso y los controles correspondientes.</p><h2>Fotografías y marcas</h2><p>Las fotografías de inspiración pertenecen a sus respectivos fabricantes y no representan obras realizadas por Hauskeepers. Los nombres de marca se usan para identificar las líneas de soluciones. Las configuraciones y disponibilidad deben consultarse con un asesor.</p><p>Consulta actualizada: 21 de octubre de 2026.</p><Link className="text-link" href="/">Volver al recorrido →</Link></article>;
  return <><div className={`inner-hero section-pad inner-${section}`}><Link className="eyebrow breadcrumb" href="/">INICIO / {section === 'inspiracion' ? 'INSPIRACIÓN' : section.toUpperCase()}</Link><h1>{sectionTitles[section]}</h1><p>{section === 'soluciones' ? 'Empieza por lo que quieres lograr. Descubre cómo hacerlo posible.' : section === 'inspiracion' ? 'No necesitas saber el nombre de un sistema. Solo imaginar lo que quieres cambiar.' : section === 'marcas' ? 'Movimiento, materialidad y equipamiento dentro del universo Hauskeepers.' : section === 'profesionales' ? 'Soluciones para quienes diseñan, fabrican y construyen.' : 'Conoce el espacio y conversa con el equipo.'}</p></div>{section === 'soluciones' && <SolutionsIndex />}{section === 'inspiracion' && <Inspiration full />}{section === 'marcas' && <Brands full />}{section === 'profesionales' && <Professionals full />}{section === 'showroom' && <Showroom full />}</>;
}
