import { Outlet } from "react-router";
import type { Route } from "./+types/_auth";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return null;
}

export default function AuthLayout() {
  return <Outlet />;
}
