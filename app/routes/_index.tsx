import { useSession } from "@agent-native/core/client/hooks";
import { IconBrandGithub } from "@tabler/icons-react";
import { useRef } from "react";

import { Film, IMAGES } from "@/components/landing/Film";
import { Wordmark } from "@/components/court/primitives";

const TITLE = "Objection! Put the decision on trial";
const DESCRIPTION =
  "Two AI counsel argue your decision from your own evidence, one for and one against. Every quote is checked in code. You hold the gavel.";

export function meta() {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },
  ];
}

const REPO = "https://github.com/midexol/objection";

/** Straight in when signed in; signed-out visitors enter as a guest, no form. */
function useEnter() {
  const { session } = useSession() as { session?: { email?: string } | null };
  const signedIn = !!session?.email;
  return {
    signedIn,
    enter: (path: string) => (signedIn ? path : `/guest?to=${encodeURIComponent(path)}`),
  };
}

const pillIvory =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const pillGold =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-brass px-9 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-strong focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const pillGhost =
  "inline-flex min-h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass";

export default function LandingRoute() {
  const { enter, signedIn } = useEnter();
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <div ref={scroller} className="film-ink fixed inset-0 overflow-y-auto overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 py-5 sm:px-10">
        <span className="rounded-full border border-line bg-bench/80 px-4 py-2 backdrop-blur">
          <Wordmark className="text-[22px]" />
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          {!signedIn && (
            <a
              href="/sign-in?return=%2Fcourt"
              className="hidden min-h-12 items-center rounded-full px-3 text-[15px] font-semibold text-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:inline-flex"
            >
              Sign in
            </a>
          )}
          <a href={enter("/court")} className={pillIvory}>
            Enter the court
          </a>
        </div>
      </header>

      <Film scroller={scroller} enterHref={enter("/court/new")} sampleHref={enter("/court?sample=1")} />

      <section className="relative isolate overflow-hidden bg-[hsl(52_100%_60%)]">
        <img
          src={IMAGES.lamp}
          alt=""
          aria-hidden="true"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25 mix-blend-multiply grayscale"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_50%_45%,transparent,hsl(52_100%_60%)_85%)]" />
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-4 py-32 text-center sm:py-44">
          <h2
            className="font-didone font-black leading-[0.9] tracking-[-0.03em]"
            style={{ fontSize: "clamp(52px, 8vw, 128px)" }}
          >
            Your next big call
            <br />
            <span className="font-serif font-normal italic text-defense">deserves a cross-examination.</span>
          </h2>
          <p className="max-w-[520px] text-[17px] leading-relaxed text-foreground/80">
            File a motion, enter your evidence, and watch both sides argue it. No sign-up needed: you enter as a guest, and the sample trial runs without any API key.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={enter("/court/new")} className={pillGold}>
              File a case
            </a>
            <a href={enter("/court?sample=1")} className={pillGhost}>
              Watch a sample trial
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[hsl(52_100%_60%)]"><div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 pb-10 pt-6 text-[13px] text-foreground/60 sm:px-10">
        <span>Objection!, built on Agent-Native for the Builder.io hackathon, November 2026</span>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href={REPO}
            className="inline-flex min-h-10 items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            <IconBrandGithub className="size-4" aria-hidden="true" /> Source
          </a>
          <span>Photos by Tim Mus, Johnny Briggs and Alexander Voronov on Unsplash</span>
        </div>
      </div></footer>
    </div>
  );
}
