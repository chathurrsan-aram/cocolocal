import type { Metadata } from 'next';
import PropertyGuide from './PropertyGuide';

export const metadata: Metadata = {
  title: 'Property guide',
  description: 'Private ground-floor property guide.',
  robots: { index: false, follow: false, nocache: true },
};

export default function PropertyGuidePage() {
  return <PropertyGuide />;
}
