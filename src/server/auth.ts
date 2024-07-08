import { type NextAuthOptions, getServerSession, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
	session: {
		strategy: "jwt", //(1)
	},
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account && account.type === "credentials") {
				//(2)
				token.userId = account.providerAccountId; // this is Id that coming from authorize() callback
			}
			return token;
		},
		async session({ session, token, user }) {
			session.user.id = token.userId; //(3)
			return session;
		},
	},
	pages: {
		signIn: "/login", //(4) custom signin page path
	},
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				username: { label: "Username", type: "text", placeholder: "username" },
			},
			async authorize(credentials): Promise<User> {
				const { username } = credentials as {
					username: string;
				};

				return {
          email: username,
          id: username,
					name: username,
				};
			},
		}),
	],
};

export const getServerAuthSession = () => getServerSession(authOptions); //(6)
