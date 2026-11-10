import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { PhoneFrame, ScreenBody } from "@/components/AppShell";
import { Field, FormError } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

const MIN_PASSWORD = 8;

const ROLE_LABEL: Record<UserRole, string> = { owner: "pet owner", provider: "care provider" };

export function SignUp() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role: UserRole = params.get("role") === "provider" ? "provider" : "owner";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (session) return <Navigate to="/home" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Enter your name.");
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Supabase only honours this if the URL is in Authentication → URL Configuration → Redirect URLs.
      options: { data: { full_name: fullName.trim(), role }, emailRedirectTo: `${window.location.origin}/login` },
    });
    setBusy(false);

    if (signUpError) return setError(signUpError.message);
    // With email confirmation on, Supabase returns no session until the link is clicked.
    if (data.session) navigate("/home", { replace: true });
    else setCheckEmail(true);
  };

  return (
    <PhoneFrame>
      <AppBar title="Sign up" back="/" />
      <ScreenBody className="pb-10">
        {checkEmail ? (
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-mint">
              <MailCheck className="size-6" aria-hidden />
            </span>
            <h2 className="font-heading text-xl font-extrabold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-semibold text-navy">{email}</span>. Open it on this
              device, then log in.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Go to Log in</Link>
            </Button>
          </Card>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Joining as a {ROLE_LABEL[role]}</p>
              <p className="font-heading text-2xl font-extrabold">Create your account</p>
            </div>
            <Card className="p-4">
              <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                <Field
                  id="name"
                  label="Your name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  hint={`At least ${MIN_PASSWORD} characters`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FormError message={error} />
                <Button type="submit" size="lg" disabled={busy}>
                  {busy ? "Creating account…" : "Sign up"}
                </Button>
              </form>
            </Card>
            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold underline underline-offset-4">
                Log in
              </Link>
            </p>
          </>
        )}
      </ScreenBody>
    </PhoneFrame>
  );
}

export function LogIn() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: logInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (logInError) return setError(logInError.message);
    navigate(from, { replace: true });
  };

  return (
    <PhoneFrame>
      <AppBar title="Log in" back="/" />
      <ScreenBody className="pb-10">
        <p className="font-heading text-2xl font-extrabold">Welcome back</p>
        <Card className="p-4">
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FormError message={error} />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm">
          New to Furbourhood?{" "}
          <Link to="/" className="font-semibold underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </ScreenBody>
    </PhoneFrame>
  );
}
