const hostname = window.location.hostname;

// Booking domain: only public routes (registration, presentation form)
export const isBookingDomain = hostname === 'boka.willeworldwide.se';

// Admin domain: login + dashboard routes
export const isAdminDomain = hostname === 'admin.willeworldwide.se';

// Development or other domains: show everything
export const isDevDomain = !isBookingDomain && !isAdminDomain;
