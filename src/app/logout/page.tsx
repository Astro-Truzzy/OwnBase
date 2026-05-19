import { SignOutRedirect } from "./sign-out-redirect";

/** Legacy URL — signs out via POST to `/auth/sign-out`. */
export default function LogoutPage() {
  return <SignOutRedirect />;
}
