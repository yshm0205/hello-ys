import { redirect } from "next/navigation";

import { EntertainmentReactionLabContent } from "@/components/dashboard/EntertainmentReactionLabContent";
import { getAuthenticatedUser, isEntertainmentReactionAllowed } from "@/lib/script-generator/server";

export default async function EntertainmentReactionLabPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isEntertainmentReactionAllowed(user)) {
    redirect("/dashboard");
  }

  return <EntertainmentReactionLabContent userEmail={user.email} />;
}
