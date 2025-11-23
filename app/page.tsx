import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingClient from "./landing-client";

export default async function Home() {
  // PRD: No auth in v1. Landing page is public.
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  // if (!session) {
  //   redirect('/sign-in');
  // }

  return <LandingClient />;
}
