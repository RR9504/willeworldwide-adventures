import { Check, MapPinned } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItinerarySection, TripItinerary } from '@/types/trip';

function SectionBlock({ section }: { section: ItinerarySection }) {
  const isTimeline = section.items.some(item => item.time);

  return (
    <section>
      <h3 className="font-heading text-lg font-bold">{section.title}</h3>
      {section.intro && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{section.intro}</p>}

      {isTimeline ? (
        <ol className="mt-3 space-y-0">
          {section.items.map((item, i) => (
            <li key={i} className="relative flex gap-4 pb-4 pl-1 last:pb-0">
              {/* Linje + punkt */}
              <div className="flex flex-col items-center">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-accent" />
                {i < section.items.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="flex flex-col gap-0.5 pb-1 sm:flex-row sm:gap-4">
                <span className="w-28 shrink-0 text-sm font-semibold text-foreground">{item.time}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}

      {section.outro && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{section.outro}</p>}
    </section>
  );
}

export function TripItineraryView({ itinerary }: { itinerary: TripItinerary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPinned className="h-5 w-5 text-primary" /> Resenärsschema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {itinerary.intro && <p className="text-sm text-muted-foreground leading-relaxed">{itinerary.intro}</p>}
        {itinerary.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
        {itinerary.outro && (
          <p className="rounded-lg bg-accent p-4 text-sm leading-relaxed text-foreground">{itinerary.outro}</p>
        )}
      </CardContent>
    </Card>
  );
}
