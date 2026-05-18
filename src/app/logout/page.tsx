import { redirect } from "next/navigation";

/** Legacy URL used by older sign-out buttons — real sign-out happens in `/auth/sign-out`. */
export default function LogoutPage() {
  redirect("/auth/sign-out");
}
