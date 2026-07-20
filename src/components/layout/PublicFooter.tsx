import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook } from 'lucide-react';
import Logo from './Logo';
import { contactInfo, offerings } from '@/data/siteContent';

const PublicFooter = () => (
  <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground/70">
    <div className="container grid gap-10 py-14 md:grid-cols-3">
      <div>
        <Logo className="h-8" />
        <p className="mt-4 max-w-xs text-sm leading-relaxed">
          Din personliga resebyrå för gruppresor – med specialitet på skidresor med buss.
          Vi skapar reseminnen för livet.
        </p>
        <a
          href={contactInfo.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm hover:text-sidebar-foreground"
        >
          <Facebook className="h-4 w-4" /> Följ oss på Facebook
        </a>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-sidebar-foreground">Våra resor</h3>
        <ul className="space-y-2 text-sm">
          {offerings.map((o) => (
            <li key={o.slug}>
              <Link to={`/${o.slug}`} className="hover:text-sidebar-foreground">
                {o.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-sidebar-foreground">Kontakt</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <a href={`mailto:${contactInfo.email}`} className="hover:text-sidebar-foreground">
              {contactInfo.email}
            </a>
          </li>
          {contactInfo.phones.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={`tel:${p.replace(/\s/g, '')}`} className="hover:text-sidebar-foreground">
                {p}
              </a>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {contactInfo.company}
              <br />
              {contactInfo.address}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-sidebar-border">
      <div className="container flex flex-col gap-1 py-6 text-xs text-sidebar-foreground/50 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} {contactInfo.company}. Alla rättigheter förbehållna.</p>
        <p>Resegaranti via {contactInfo.guarantor}.</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
