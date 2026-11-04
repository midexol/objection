import { createH3SSRHandler } from "@agent-native/core/server/ssr-handler";

// The public landing page lives at "/". The page catch-all does not match the
// bare root, so render it through the same SSR handler.
export default createH3SSRHandler(
  () => import("virtual:react-router/server-build"),
);
