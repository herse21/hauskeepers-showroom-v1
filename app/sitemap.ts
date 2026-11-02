import type { MetadataRoute } from 'next';
import { sections, siteUrl } from '../lib/content';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap { return ['', ...sections].map((section, i) => ({ url: `${siteUrl}/${section}`, changeFrequency: 'monthly', priority: i === 0 ? 1 : 0.7 })); }
