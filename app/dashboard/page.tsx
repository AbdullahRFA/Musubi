import { redirect } from "next/navigation";

/**
 * The v2 architecture integrates all dashboard actions into the homepage.
 * A server-side redirect avoids rendering a "Redirecting..." flash.
 */
export default function DashboardPage() {
  redirect("/");
}
