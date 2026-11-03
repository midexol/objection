/**
 * Citation verification. This is plain code, not a model: a quote is accepted
 * only when its words appear in the cited exhibit's text.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’“”"'`]/g, "")
    .replace(/[^\p{L}\p{N}%₦$€£.\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text)
    .split(" ")
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter(Boolean);
}

/**
 * True when the quote occurs in the exhibit. Exact (normalized) substrings pass;
 * otherwise a contiguous window of the exhibit must share at least 90% of the
 * quote's words in order, which tolerates small punctuation or casing slips but
 * not invented content.
 */
export function quoteAppearsIn(quote: string, exhibitText: string): boolean {
  const q = normalize(quote);
  if (q.length < 3) return false;
  const haystack = normalize(exhibitText);
  if (haystack.includes(q)) return true;

  const qw = words(quote);
  const hw = words(exhibitText);
  if (qw.length < 4 || hw.length < qw.length) return false;

  const need = Math.ceil(qw.length * 0.9);
  const span = qw.length + 2;
  for (let start = 0; start + qw.length <= hw.length; start++) {
    const window = hw.slice(start, start + span);
    let qi = 0;
    let matched = 0;
    for (const w of window) {
      if (qi < qw.length && w === qw[qi]) {
        matched++;
        qi++;
      } else if (qi + 1 < qw.length && w === qw[qi + 1]) {
        matched++;
        qi += 2;
      }
    }
    if (matched >= need) return true;
  }
  return false;
}
