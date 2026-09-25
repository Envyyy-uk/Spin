// Runtime configuration for external integrations.
//
// Only EXPO_PUBLIC_* variables are inlined into the client bundle, and anything
// inlined is visible to every user. NEVER put private API keys here: point these
// URLs at your own backend/proxy, which keeps provider keys server-side.
// See .env.example.

const env = typeof process !== 'undefined' && process.env ? process.env : {};

export const config = {
  // Base URL of your backend that implements POST /suggestions (see suggestionsService.js).
  suggestionsApiUrl: env.EXPO_PUBLIC_SUGGESTIONS_API_URL || '',
  // Base URL of your backend that implements POST /estimate (see pricingService.js).
  pricingApiUrl: env.EXPO_PUBLIC_PRICING_API_URL || '',
  // Optional affiliate id appended to Booking.com links.
  bookingAffiliateId: env.EXPO_PUBLIC_BOOKING_AID || '',
  requestTimeoutMs: 12000,
};

export const isDemoMode = !config.suggestionsApiUrl;
