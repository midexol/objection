import { createToolkitAuthPlugin, renderAuthPage } from "@agent-native/toolkit/app/auth/server";

/**
 * The framework's sign-in page ships a dark palette. Objection! is bright, so the
 * page gets the court's colours: a highlighter-yellow field, a white card, ink type.
 * The page has no theme layer of its own, so the stylesheet goes into <head> from
 * an inline script that removes itself before the page hydrates, which leaves the
 * hydrated markup exactly as the toolkit rendered it.
 */
const SIGN_IN_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Gloock&family=Schibsted+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@500&display=swap");
:root { color-scheme: light; }
body {
  background: hsl(52 100% 60%);
  color: hsl(24 18% 8%);
  font-family: "Schibsted Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 16px;
}
.card {
  background: #fff;
  border: 1.5px solid hsl(24 18% 8%);
  border-radius: 24px;
  box-shadow: 6px 6px 0 hsl(24 18% 8%);
  width: 100%;
  max-width: 420px;
}
.card::before {
  content: "OBJECTION! COURT";
  display: block;
  margin-bottom: 14px;
  font: 500 11px/1 "Geist Mono", ui-monospace, monospace;
  letter-spacing: 0.18em;
  color: hsl(8 82% 48%);
}
h1 {
  color: hsl(24 18% 8%);
  font-family: "Gloock", Georgia, serif;
  font-weight: 400;
  font-size: 40px;
  line-height: 1;
  letter-spacing: -0.01em;
}
.subtitle, label, .legal-note, .divider, .progress-step, .verification-note, .google-debug { color: hsl(24 10% 38%); }
.legal-note a { color: hsl(226 86% 48%); }
.tabs { background: hsl(42 38% 93%); border-radius: 999px; }
.tab { color: hsl(24 10% 38%); border-radius: 999px; }
.tab:hover:not(.active) { color: hsl(24 18% 8%); }
.tab.active { background: hsl(24 18% 8%); color: #fff; box-shadow: none; }
input {
  background: #fff;
  color: hsl(24 18% 8%);
  border: 1px solid hsl(36 14% 78%);
  border-radius: 12px;
  font-size: 16px;
}
input:focus { border-color: hsl(226 86% 48%); box-shadow: 0 0 0 3px hsl(226 86% 48% / 0.18); outline: none; }
input::placeholder { color: hsl(24 8% 62%); }
button[type="submit"], .btn-primary, .btn-google {
  background: hsl(24 18% 8%);
  color: #fff;
  border-radius: 999px;
  font-weight: 600;
}
button[type="submit"]:hover, .btn-primary:hover, .btn-google:hover { background: hsl(24 18% 20%); }
.btn-secondary, .btn-google.magic-link-secondary {
  color: hsl(24 18% 8%);
  border: 1px solid hsl(24 18% 8% / 0.25);
  border-radius: 999px;
}
.btn-secondary:hover, .btn-google.magic-link-secondary:hover { color: hsl(24 18% 8%); background: hsl(52 100% 92%); }
.link-button { color: hsl(226 86% 48%); }
.link-button:hover { color: hsl(226 86% 36%); }
.msg.error, .google-error { color: hsl(8 82% 42%); }
.msg.success, .verification-kicker { color: hsl(226 86% 44%); }
.divider::before, .divider::after, .progress-step::before { background: hsl(36 14% 84%); }
.upgrade-note, .verification-panel, .signup-local-mode-note {
  background: hsl(42 38% 96%);
  border: 1px solid hsl(36 14% 84%);
  color: hsl(24 10% 32%);
}
.verification-copy, .verification-copy strong, .magic-link-success-copy { color: hsl(24 18% 8%); }
.progress-step span { background: #fff; border-color: hsl(36 14% 78%); color: hsl(24 10% 38%); }
.progress-step.complete, .progress-step.current { color: hsl(24 18% 8%); }
.progress-step.current span { background: hsl(24 18% 8%); border-color: hsl(24 18% 8%); color: #fff; box-shadow: none; }
.progress-step.complete span { background: hsl(226 86% 48% / 0.12); border-color: hsl(226 86% 48% / 0.5); color: hsl(226 86% 36%); }
.locale-trigger { color: hsl(24 18% 8%); }
`;

const injectStyles = `<script>(function(){var s=document.createElement("style");s.setAttribute("data-objection-auth","");s.textContent=${JSON.stringify(
  SIGN_IN_CSS,
).replace(/</g, "\\u003c")};document.head.appendChild(s);var c=document.currentScript;if(c)c.remove();})();</script>`;

export default createToolkitAuthPlugin({
  publicPaths: ["/guest"],
  workspaceAppPublicPaths: ["/", "/guest"],
  rootAuth: false,
  marketing: false,
  renderSignInPage: (props) => injectStyles + renderAuthPage(props),
});
