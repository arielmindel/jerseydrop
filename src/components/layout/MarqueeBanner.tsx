/**
 * Top marquee — sits above the Header, full width, ~32px tall.
 * Black background with a 1px neon-green underline. Continuously scrolls
 * 4 trust messages right-to-left visually (using `animate-marquee` from
 * tailwind.config). Pauses on hover.
 *
 * RTL note: in `dir="rtl"` the document baseline runs right-to-left, but
 * for a marquee we *always* want one consistent visual scroll direction.
 * We use translateX(-50%) regardless of direction; the container
 * duplicates the message strip so the loop is seamless.
 */
const MESSAGES = [
  "התאמה אישית חינם — שם, מספר, פאצ׳",
  "אחריות על כל משלוח",
  "משלוח 10–15 ימי עסקים · מכס ודמי משלוח כלולים",
  "ייצור על פי הזמנה · איכות מקורית",
];

export default function MarqueeBanner() {
  return (
    <div
      className="group relative isolate overflow-hidden border-b border-accent/40 bg-[#0A0A0A] text-foreground"
      dir="ltr"
      aria-label="Promotions and policies"
    >
      <div className="marquee-track flex items-center whitespace-nowrap py-2 font-display text-xs font-semibold uppercase tracking-widest">
        {/* The strip is rendered twice — animation translates by -50%
            (one full strip width) so the second copy seamlessly takes over. */}
        {[0, 1].map((dup) => (
          <ul
            key={dup}
            className="flex shrink-0 items-center gap-10 px-5"
            aria-hidden={dup === 1 ? "true" : undefined}
          >
            {MESSAGES.map((msg, i) => (
              <li key={i} className="flex items-center gap-10">
                <span>{msg}</span>
                <span className="text-accent" aria-hidden="true">
                  •
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
