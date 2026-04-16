import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: { select: { type: true } } },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.hashedPassword);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          orgType: user.organization?.type ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.orgType = user.orgType ?? null;
      }
      // Allow client-side session.update() to refresh orgType
      if (trigger === "update" && session?.orgType !== undefined) {
        token.orgType = session.orgType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = String(token.role ?? "");
        session.user.organizationId = String(token.organizationId ?? "");
        session.user.orgType = (token.orgType as string | null) ?? null;
      }
      return session;
    },
  },
});
