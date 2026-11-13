import type { Metadata } from 'next';
import { BlumReview } from '../../components/blum-review';
import './showroom-3d.css';

export const metadata: Metadata = {
  title: 'Revisión 3D de herrajes Blum',
  robots: { index: false, follow: false },
};

export default function ShowroomReviewPage() {
  return <BlumReview />;
}
