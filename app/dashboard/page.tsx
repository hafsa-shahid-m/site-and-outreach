import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BarsPanel,
  ClicksPanel,
  FilteredTile,
  FunnelPanel,
  ProposalsPanel,
  TablePanel,
  TrafficPanel,
} from "../../components/Panels";
import LogoutButton from "../../components/LogoutButton";
import ReachoutForm from "../../components/ReachoutForm";
import { getDb } from "../../lib/db";
import { defaultRange } from "../../lib/range";
import { listRecentReachouts, listRecipients } from "../../lib/reachouts";
import { readSession } from "../../lib/session";
import { siteUrl } from "../../lib/site-url";
import { links } from "../../links";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function Dashboard() {
  // YOUR TURN start dashboard-guard
  // Chapter 4.10. Without a valid session, go to /login. Until you do, everyone is sent there.
  redirect("/login");
  // YOUR TURN end dashboard-guard

  const range = defaultRange();
  const db = getDb();
  const [recipients, recent] = await Promise.all([listRecipients(db).catch(() => []), listRecentReachouts(db).catch(() => [])]);

  return (
    <main className="wide">
      <h1>Dashboard</h1>
      <LogoutButton />

      {/* YOUR TURN start dashboard-outreach-layout */}
      {null}
      {/* YOUR TURN end dashboard-outreach-layout */}

      {/* YOUR TURN start reachout-form */}
      {null}
      {/* YOUR TURN end reachout-form */}

      {/* YOUR TURN start dashboard-traffic-layout */}
      {null}
      {/* YOUR TURN end dashboard-traffic-layout */}

      {/* YOUR TURN start dashboard-panels */}
      <p>Panels go here. Chapter 4.11.</p>
      {/* YOUR TURN end dashboard-panels */}
    </main>
  );
}
