import { Redirect } from "expo-router";

// Every claw machine lives at its own /claw/[slug] route; the root just
// redirects to the default one instead of duplicating ClawHeroScreen's
// data-loading logic for a "no slug" case.
export default function Index() {
  return <Redirect href="/claw/pokemon-gold" />;
}
