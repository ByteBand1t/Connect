import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      orgType: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    organizationId: string;
    orgType: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    orgType: string | null;
  }
}
