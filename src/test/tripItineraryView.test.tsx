import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TripItineraryView } from '@/components/trips/TripItineraryView';
import { TripItinerary } from '@/types/trip';

const itinerary: TripItinerary = {
  intro: 'Vi hälsar dig varmt välkommen till vår supporterresa till Bratislava.',
  sections: [
    {
      title: 'Resefakta',
      items: [
        { text: 'Resdatum: 9–12 augusti 2026' },
        { text: 'Boende: Clarion Congress Hotel Bratislava' },
      ],
    },
    {
      title: 'Söndag 9 augusti – Avresa',
      intro: 'Resan börjar i Hällevik och fortsätter genom södra Sverige.',
      items: [
        { time: '12.30', text: 'Avresa från Strandvallen, Hällevik' },
        { time: 'Ca 19.00', text: 'Färja Rødby–Puttgarden' },
      ],
    },
    {
      title: 'Måndag 10 augusti – Bratislava',
      items: [{ time: 'Från 15.00', text: 'Incheckning på Clarion Congress Hotel Bratislava' }],
      outro: 'Övernattning på hotellet.',
    },
  ],
  outro: 'Trevlig resa! Vi ses ombord!',
};

describe('TripItineraryView', () => {
  it('renderar rubrik, sektioner, tider och texter', () => {
    render(<TripItineraryView itinerary={itinerary} />);

    expect(screen.getByText('Resenärsschema')).toBeInTheDocument();
    expect(screen.getByText('Vi hälsar dig varmt välkommen till vår supporterresa till Bratislava.')).toBeInTheDocument();

    expect(screen.getByText('Resefakta')).toBeInTheDocument();
    expect(screen.getByText('Resdatum: 9–12 augusti 2026')).toBeInTheDocument();

    expect(screen.getByText('Söndag 9 augusti – Avresa')).toBeInTheDocument();
    expect(screen.getByText('12.30')).toBeInTheDocument();
    expect(screen.getByText('Avresa från Strandvallen, Hällevik')).toBeInTheDocument();
    expect(screen.getByText('Ca 19.00')).toBeInTheDocument();

    expect(screen.getByText('Övernattning på hotellet.')).toBeInTheDocument();
    expect(screen.getByText('Trevlig resa! Vi ses ombord!')).toBeInTheDocument();
  });
});
