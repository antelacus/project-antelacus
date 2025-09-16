export { metadata } from '../page';
import Home from '../page';

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  await params; // ensure type compatibility; home renders the same across locales
  return Home();
}


