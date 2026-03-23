
# WilleWorldWide – Resebokningsplattform

## Koncept
En plattform inspirerad av smsparbank-event, anpassad för WilleWorldWide. Admin skapar resor med helt modulära anmälningsformulär. Kunder anmäler sig via publika länkar eller en resekatalog. Admin kan hantera, kommunicera med och exportera deltagardata på smarta sätt.

## Design & varumärke
- WilleWorldWide-profil: vit/rosa/grå färgpalett med deras logotyp
- Mörk header med snöig, äventyrlig känsla
- Modernt, mobilanpassat gränssnitt

## Sidor & funktioner

### 1. Publik resekatalog (`/`)
- Visar alla publicerade resor med bild, destination, datum, pris
- Filtrera på typ (skidresa, gruppresor, företag)
- Klickbar till varje resas anmälningssida

### 2. Publik anmälningssida (`/resa/:id`)
- Hero-bild, resinfo (datum, plats, pris, platser kvar)
- Dynamiskt anmälningsformulär baserat på resans konfiguration
- Fält kan vara: text, e-post, telefon, select (dropdown), checkbox med villkorsfält, textarea
- GDPR-godkännande
- Bekräftelsesida efter inskickad anmälan

### 3. Admin: Dashboard (`/dashboard`)
- Översikt: aktiva resor, totalt anmälda, kommande resor
- Sök och filtrera resor
- Skapa ny resa-knapp

### 4. Admin: Skapa/redigera resa (`/dashboard/resor/ny` & `/dashboard/resor/:id/redigera`)
- Titel, beskrivning, datum, tid, plats, bild med positionering
- Max antal deltagare, visa/dölj bokade platser
- **Modulär formulärbyggare**: Lägg till/ta bort/ordna fält fritt
  - Fälttyper: text, e-post, telefon, textarea, select (dropdown med val), checkbox
  - Checkbox kan ha villkorsfält (visas när ikryssad)
  - Markera fält som "räknas som extra deltagare"
  - Standardfält: namn, e-post, telefon – men allt är anpassningsbart
- Status: utkast/publicerad/stängd

### 5. Admin: Resadetaljer & deltagarhantering (`/dashboard/resor/:id`)
- Resainfo + delbar länk
- Deltagarlista med alla inskickade svar
- **Betalningsstatus**: markera per deltagare (betald/ej betald), skicka påminnelse
- **Smart filtrering & export**:
  - Filtrera deltagare baserat på ALLA formulärfält (t.ex. alla som valt "skidhyra", alla med viss kostpreferens)
  - Exportera filtrerad lista som CSV/Excel
  - Sammanställning: antal per val (t.ex. 12 st dubbelrum, 8 st liftkort vuxen)
- **Kommunikation**: skicka e-post till alla eller filtrerade deltagare

### 6. Admin: Sammanställning per resa
- Automatisk sammanställning av alla svar per fält
- Visuell översikt: antal rum, liftkort, allergier etc.
- Exportera sammanställningen

### 7. Inloggning
- Admin-inloggning med e-post/lösenord via Supabase Auth

## Inbäddning
- Möjlighet att bädda in resekatalogen eller enskilda resor som iframe på willeworldwide.se

## Databas (Supabase/Lovable Cloud)
- Resor (trips) med modulära formulärfält (JSON)
- Anmälningar (registrations) med dynamisk data
- Betalningsstatus per anmälan
- Auth för admin

## Teknik
- React + TypeScript + Tailwind + shadcn/ui
- Supabase för databas, auth och edge functions
- React Email för kundkommunikation
