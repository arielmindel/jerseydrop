/**
 * Tiny dark gradient PNG (8×10) baked at build time. Used as a `placeholder="blur"`
 * data URL on Shopify CDN images so we get a soft fade-in instead of a flash of
 * empty bg. Encoded once and exported as a const.
 *
 * Image: dark navy (#0a0e14) → muted slate (#1f2937) vertical gradient.
 */
export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAYAAACALL/6AAAAJUlEQVR42mNk+P+/noEEwMQwasCoAaMGjBowasCoAaMGDFEDAEdAAQ73+rJfAAAAAElFTkSuQmCC";
