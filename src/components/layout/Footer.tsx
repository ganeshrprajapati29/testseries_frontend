import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons';
import { Link } from 'react-router-dom';
import { MAIN_SITE_URL, ROUTES } from '@/app/constants';
import { useSettings } from '@/hooks/useSettings';

export function Footer() {
  const { settings, logoUrl, siteName } = useSettings();
  const main = settings?.mainWebsiteUrl || MAIN_SITE_URL;
  const socials = [
    { href: settings?.facebookUrl, label: 'Facebook', icon: FacebookIcon },
    { href: settings?.instagramUrl, label: 'Instagram', icon: InstagramIcon },
    { href: settings?.youtubeUrl, label: 'YouTube', icon: YoutubeIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-0.5" />
            <div>
              <p className="text-lg font-extrabold text-white">{siteName}</p>
              <p className="text-xs text-slate-400">{settings?.tagline}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            A trusted learning platform for UPSC, Defence, JEE, NEET, PSC and other exams, offering expert guidance, structured courses and result-oriented preparation.
          </p>
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(({ href, label, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-lg bg-slate-800 p-2 text-slate-300 transition hover:bg-brand-600 hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Practice</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" to={ROUTES.testSeries}>All Test Series</Link></li>
            <li><Link className="hover:text-white" to={ROUTES.pyqs}>Previous Year Papers</Link></li>
            <li><Link className="hover:text-white" to={ROUTES.categories}>Browse Exams</Link></li>
            <li><Link className="hover:text-white" to={ROUTES.dashboard}>My Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Civil Sansad</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a className="hover:text-white" href={main} target="_blank" rel="noopener noreferrer">Main Website</a></li>
            <li><a className="hover:text-white" href={`${main}/courses`} target="_blank" rel="noopener noreferrer">Courses</a></li>
            <li><a className="hover:text-white" href={`${main}/about`} target="_blank" rel="noopener noreferrer">About Us</a></li>
            <li><a className="hover:text-white" href={`${main}/contact`} target="_blank" rel="noopener noreferrer">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {settings?.contactPhone && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <a className="hover:text-white" href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}>{settings.contactPhone}</a>
              </li>
            )}
            {settings?.whatsappNumber && (
              <li className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <a className="hover:text-white" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              </li>
            )}
            {settings?.contactEmail && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <a className="hover:text-white" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
          <p>
            <a className="hover:text-slate-300" href={main} target="_blank" rel="noopener noreferrer">civilsansad.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
