import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trip } from '@/types/trip';
import { motion } from 'framer-motion';

const categoryLabels: Record<string, string> = {
  ski: 'Skidresa',
  group: 'Gruppresa',
  corporate: 'Företag',
  other: 'Övrigt',
};

interface TripCardProps {
  trip: Trip;
  registrationCount?: number;
}

const TripCard = ({ trip, registrationCount = 0 }: TripCardProps) => {
  const spotsLeft = trip.max_participants - registrationCount;
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const dateStr = `${startDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link to={`/resa/${trip.id}`}>
        <Card className="group overflow-hidden border-border/60 transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="relative h-52 overflow-hidden">
            <img
              src={trip.image_url}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
              {categoryLabels[trip.category] || trip.category}
            </Badge>
            <div className="absolute bottom-3 right-3 font-heading text-xl font-bold text-white">
              {trip.price.toLocaleString('sv-SE')} {trip.currency}
            </div>
          </div>
          <CardContent className="space-y-3 p-5">
            <h3 className="font-heading text-lg font-bold leading-tight text-foreground">{trip.title}</h3>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {trip.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> {dateStr}
              </span>
              {trip.show_spots_left && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {spotsLeft > 0 ? `${spotsLeft} platser kvar` : 'Fullbokad'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default TripCard;
