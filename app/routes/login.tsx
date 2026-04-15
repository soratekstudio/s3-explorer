import { Form, redirect, useActionData, useNavigation, data } from "react-router";
import type { Route } from "./+types/login";
import { isAuthEnabled, login, logout, getSession, checkRateLimit, getClientIp } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Database, Loader2, Lock } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAuthEnabled()) throw redirect("/");
  const session = await getSession(request);
  if (session.get("authenticated")) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  if (url.searchParams.has("logout")) {
    const cookie = await logout(request);
    return redirect("/login", { headers: { "Set-Cookie": cookie } });
  }

  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return data(
      { error: `Too many attempts. Try again in ${rateCheck.retryAfter}s.` },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return data({ error: "Username and password are required." }, { status: 400 });
  }

  const cookie = await login(username, password);
  if (!cookie) {
    return data({ error: "Invalid username or password." }, { status: 401 });
  }

  return redirect("/", { headers: { "Set-Cookie": cookie } });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,rgba(6,182,212,0.1),transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent)] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8 space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 opacity-20 blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Database className="h-9 w-9 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">S3 Explorer</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your storage</p>
          </div>
        </div>

        <Form
          method="post"
          className="space-y-4 bg-card text-card-foreground backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter username"
              className="h-11 bg-background border-border focus:border-cyan-500"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              className="h-11 bg-background border-border focus:border-cyan-500"
              autoComplete="current-password"
              required
            />
          </div>

          {actionData?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {actionData.error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
