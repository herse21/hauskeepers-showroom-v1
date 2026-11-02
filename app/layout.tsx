import type { Metadata, Viewport } from 'next';
import { ExperienceProvider, Footer, Header, MotionObserver } from '../components/experience';
import { content, siteUrl } from '../lib/content';
import './styles.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Hauskeepers · Posibilidades para tu espacio', template: '%s · Hauskeepers' },
  description: 'Descubre movimiento, almacenamiento, superficies y equipamiento para tu proyecto. Explora el showroom digital de Hauskeepers en Mérida, Yucatán.',
  openGraph: { type: 'website', locale: 'es_MX', siteName: 'Hauskeepers', title: 'Hay más en tu espacio. — Hauskeepers', description: 'Movimiento, materiales y nuevas posibilidades para tus espacios. Descubre Hauskeepers.', images: [{ url: '/assets/og-cover.jpg', width: 1200, height: 630, alt: 'Hauskeepers · Showroom digital' }] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f3ee' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = { '@context': 'https://schema.org', '@type': 'HomeGoodsStore', name: 'Hauskeepers', url: siteUrl, image: `${siteUrl}/assets/hauskeepers-original.webp`, telephone: `+${content.contact.phone}`, address: { '@type': 'PostalAddress', streetAddress: 'Calle 20 núm. 226, Col. Juan B. Sosa', addressLocality: 'Mérida', addressRegion: 'Yucatán', postalCode: content.contact.postalCode, addressCountry: 'MX' }, sameAs: [content.brand.instagram], openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' }] };
  return <html lang="es-MX" data-scroll-behavior="smooth"><body><a href="#contenido" className="skip-link">Saltar al contenido</a><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /><ExperienceProvider><MotionObserver /><Header /><main id="contenido">{children}</main><Footer /></ExperienceProvider></body></html>;
}
