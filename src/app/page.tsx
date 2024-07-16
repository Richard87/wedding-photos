import { Login } from "@/components/Login";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function LoginPage() {
	const authSession = await getServerAuthSession();

  if (authSession?.user?.name != null) {
    return redirect(`/gallery/${authSession.user.name}`)
  }

	return (
		<>
			<div>
				<div>
					<Login />
				</div>
			</div>
		</>
	);
}
