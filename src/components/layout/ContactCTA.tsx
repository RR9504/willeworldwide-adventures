import { Link } from 'react-router-dom';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contactInfo } from '@/data/siteContent';

interface ContactCTAProps {
  heading?: string;
  text?: string;
  /** Om satt visas en primär boknings-knapp som leder in i bokningsappen. */
  bookingLink?: string;
  bookingLabel?: string;
}

const ContactCTA = ({
  heading = 'Redo att planera din nästa resa?',
  text = 'Hör av dig så tar vi fram ett förslag utifrån dina drömmar och önskemål.',
  bookingLink,
  bookingLabel = 'Se avgångar och boka',
}: ContactCTAProps) => (
  <section className="border-t bg-card">
    <div className="container flex flex-col items-center gap-6 py-16 text-center">
      <h2 className="max-w-2xl text-2xl font-bold md:text-3xl">{heading}</h2>
      <p className="max-w-xl text-muted-foreground">{text}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {bookingLink && (
          <Button asChild size="lg">
            <Link to={bookingLink}>
              {bookingLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant={bookingLink ? 'outline' : 'default'}>
          <a href={`mailto:${contactInfo.email}`}>
            <Mail className="mr-2 h-4 w-4" /> {contactInfo.email}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={`tel:${contactInfo.phones[0].replace(/\s/g, '')}`}>
            <Phone className="mr-2 h-4 w-4" /> {contactInfo.phones[0]}
          </a>
        </Button>
      </div>
    </div>
  </section>
);

export default ContactCTA;
