import { redirect } from "next/navigation";
import { currentUser } from "../../lib/auth";
import { AuthForm } from "../../components/AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  // Rendered server-side so the invite field only exists when it is required.
  const inviteRequired = Boolean(process.env["SIGNUP_CODE"]);
  return <AuthForm inviteRequired={inviteRequired} />;
}
