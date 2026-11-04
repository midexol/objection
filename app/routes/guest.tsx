import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/court/primitives";

export function meta() {
  return [{ title: "Entering the court - Objection!" }, { name: "robots", content: "noindex" }];
}

/** Only same-site paths into the court; anything else lands on the sample trial. */
function safeTarget(raw: string | null) {
  if (raw && raw.startsWith("/court") && !raw.startsWith("//")) return raw;
  return "/court?sample=1";
}

function randomToken(bytes: number) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
}

/**
 * Guest entry. Creates a throwaway account through the same public register and
 * login endpoints the sign-in form uses, then forwards into the court. Each guest
 * is an ordinary user, so the court's access rules keep their cases to themselves.
 */
export default function GuestRoute() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const target = safeTarget(new URLSearchParams(window.location.search).get("to"));
    const signIn = `/sign-in?return=${encodeURIComponent(target)}`;

    void (async () => {
      try {
        const me = await fetch("/_agent-native/auth/session", { credentials: "same-origin" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        if (me?.email) {
          window.location.replace(target);
          return;
        }
        const email = `guest-${randomToken(6)}@guest.objection.court`;
        const password = randomToken(18);
        await post("/_agent-native/auth/register", { email, password });
        await post("/_agent-native/auth/login", { email, password });
        window.location.replace(target);
      } catch {
        setFailed(true);
        window.setTimeout(() => window.location.replace(signIn), 1600);
      }
    })();
  }, []);

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[hsl(52_100%_60%)] px-4 text-center">
      <Wordmark className="text-[clamp(44px,9vw,84px)]" />
      <p className="font-mono text-[12px] tracking-[0.18em] text-foreground/70" role="status" aria-live="polite">
        {failed ? "TAKING YOU TO SIGN IN" : "SWEARING YOU IN AS A GUEST"}
      </p>
    </main>
  );
}
