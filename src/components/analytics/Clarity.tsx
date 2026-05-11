"use client";

import Script from "next/script";

/**
 * Microsoft Clarity — session recording + heatmaps.
 * Renders only when NEXT_PUBLIC_CLARITY_ID is set (so it stays off in
 * preview/dev unless explicitly wired). The official Clarity bootstrap
 * script (the (c,l,a,r,i,t,y){…} IIFE) is injected via next/script with
 * afterInteractive strategy → doesn't block page load.
 */
export default function Clarity() {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!id) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}
