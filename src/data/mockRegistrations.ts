import { Registration } from '@/types/trip';

// Helper to generate Swedish-style fake data
const names = [
  ['Anna', 'Svensson'], ['Erik', 'Johansson'], ['Lisa', 'Andersson'], ['Karl', 'Nilsson'],
  ['Maria', 'Karlsson'], ['Johan', 'Larsson'], ['Sara', 'Olsson'], ['Peter', 'Persson'],
  ['Emma', 'Eriksson'], ['Oskar', 'Gustafsson'], ['Hanna', 'Pettersson'], ['Andreas', 'Lindberg'],
  ['Sofia', 'Lindqvist'], ['Magnus', 'Holm'], ['Elin', 'Bergström'], ['David', 'Sandberg'],
  ['Klara', 'Lund'], ['Fredrik', 'Nordin'], ['Ida', 'Wallin'], ['Mikael', 'Engström'],
  ['Malin', 'Eklund'], ['Henrik', 'Sundberg'], ['Jenny', 'Sjöberg'], ['Tobias', 'Fransson'],
  ['Amanda', 'Forsberg'], ['Daniel', 'Lindgren'], ['Cecilia', 'Berg'], ['Axel', 'Nyström'],
  ['Lina', 'Holmberg'], ['Gustav', 'Lundberg'], ['Frida', 'Henriksson'], ['Pontus', 'Jansson'],
  ['Johanna', 'Åberg'], ['Simon', 'Håkansson'], ['Rebecka', 'Eliasson'], ['Mattias', 'Blom'],
];

const boardingPlaces = ['kalmar', 'karlskrona', 'kristianstad', 'lund', 'hyllie'];
const bremenBoarding = ['karlshamn', 'kristianstad', 'lund', 'hyllie'];
const hotels = ['cavalletto', 'val-de-costa'];
const roomTypes = ['double', 'single', 'family'];
const bremenRooms = ['double', 'single'];
const equipmentTypes = ['alpine', 'snowboard'];
const shoeRange = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const allergies = ['', '', '', '', 'Glutenfri', 'Laktosfri', 'Nötallergi', 'Vegetarian', 'Vegan', ''];
const paymentStatuses: Registration['payment_status'][] = ['paid', 'paid', 'paid', 'unpaid', 'partial', 'paid', 'unpaid', 'paid'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pnr = (i: number) => `19${85 + (i % 15)}${String(1 + (i % 12)).padStart(2, '0')}${String(1 + (i % 28)).padStart(2, '0')}-${String(1000 + i * 137 % 9000)}`;

function generateSkiReg(id: string, tripId: string, nameIdx: number, dateOffset: number): Registration {
  const [first, last] = names[nameIdx % names.length];
  const wantsRental = Math.random() > 0.5;
  const wantsLiftPass = Math.random() > 0.3;
  const boarding = pick(boardingPlaces);
  const hotel = pick(hotels);
  const room = pick(roomTypes);
  const allergy = pick(allergies);

  const formData: Record<string, any> = {
    'Förnamn': first,
    'Efternamn': last,
    'E-post': `${first.toLowerCase()}.${last.toLowerCase()}@mail.se`,
    'Telefon': `07${nameIdx % 10}-${String(100 + nameIdx * 7 % 900)} ${String(10 + nameIdx * 3 % 90)} ${String(10 + nameIdx * 11 % 90)}`,
    'Personnummer': pnr(nameIdx),
    'Påstigningsplats': boarding,
    'Hotell': hotel,
    'Rumstyp': room,
  };

  if (room === 'double') {
    const buddy = names[(nameIdx + 1) % names.length];
    formData['Rumskompis (vid delat dubbelrum)'] = `${buddy[0]} ${buddy[1]}`;
  }

  formData['Jag vill ha hjälp med liftkort'] = wantsLiftPass;
  formData['Skidhyra'] = wantsRental;

  if (wantsRental) {
    formData['Typ av utrustning'] = pick(equipmentTypes);
    formData['Storlek skor'] = pick(shoeRange);
  }

  if (allergy) formData['Allergier / specialkost'] = allergy;
  if (Math.random() > 0.7) formData['Övriga önskemål'] = pick(['Vill sitta längst bak på bussen', 'Firar födelsedag under resan!', 'Kan vi få rum nära varandra?', 'Tar med egen utrustning för offpist']);

  const created = `2025-${String(7 + Math.floor(dateOffset / 30)).padStart(2, '0')}-${String(1 + dateOffset % 28).padStart(2, '0')}`;
  return {
    id, trip_id: tripId, form_data: formData,
    payment_status: pick(paymentStatuses),
    created_at: created, updated_at: created,
  };
}

function generateBremenReg(id: string, nameIdx: number, dateOffset: number): Registration {
  const [first, last] = names[nameIdx % names.length];
  const wantsTent = Math.random() > 0.4;
  const room = pick(bremenRooms);
  const allergy = pick(allergies);

  const formData: Record<string, any> = {
    'Förnamn': first,
    'Efternamn': last,
    'E-post': `${first.toLowerCase()}.${last.toLowerCase()}@mail.se`,
    'Telefon': `07${nameIdx % 10}-${String(100 + nameIdx * 7 % 900)} ${String(10 + nameIdx * 3 % 90)} ${String(10 + nameIdx * 11 % 90)}`,
    'Personnummer': pnr(nameIdx),
    'Påstigningsplats': pick(bremenBoarding),
    'Rumstyp': room,
  };

  if (room === 'double') {
    const buddy = names[(nameIdx + 3) % names.length];
    formData['Rumskompis (vid delat dubbelrum)'] = `${buddy[0]} ${buddy[1]}`;
  }

  formData['Jag vill ha biljetter till Freimarkt-tältet (ca 40 EUR/kväll)'] = wantsTent;
  if (wantsTent) {
    formData['Antal kvällar i tältet'] = pick(['1', '2', '3']);
  }

  if (allergy) formData['Allergier / specialkost'] = allergy;
  if (Math.random() > 0.7) formData['Övriga önskemål'] = pick(['Vill ha bord nära scenen', 'Kommer med en grupp på 6 personer', 'Behöver extra kudde']);

  const created = `2025-09-${String(1 + dateOffset % 28).padStart(2, '0')}`;
  return {
    id, trip_id: '4', form_data: formData,
    payment_status: pick(paymentStatuses),
    created_at: created, updated_at: created,
  };
}

// Seed random for reproducibility
let seed = 42;
const seededRandom = () => { seed = (seed * 16807 % 2147483647); return (seed - 1) / 2147483646; };
Math.random = seededRandom;

export const mockRegistrations: Registration[] = [
  // Trip 1 (Vecka 3) - 18 registrations
  ...Array.from({ length: 18 }, (_, i) => generateSkiReg(`r1-${i + 1}`, '1', i, i * 3)),
  // Trip 2 (Vecka 6) - 12 registrations
  ...Array.from({ length: 12 }, (_, i) => generateSkiReg(`r2-${i + 1}`, '2', i + 18, i * 4 + 10)),
  // Trip 3 (Vecka 8) - 8 registrations
  ...Array.from({ length: 8 }, (_, i) => generateSkiReg(`r3-${i + 1}`, '3', i + 30, i * 5 + 20)),
  // Trip 4 (Bremen) - 15 registrations
  ...Array.from({ length: 15 }, (_, i) => generateBremenReg(`r4-${i + 1}`, i + 10, i * 2)),
];
