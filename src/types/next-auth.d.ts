import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    teamId: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      teamId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    teamId: string | null;
  }
}
