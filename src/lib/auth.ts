import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const loginIdentifier = (credentials.email as string).trim();
        
        // Find user by email or employee profile id or matching username
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: loginIdentifier, mode: 'insensitive' } },
              { id: loginIdentifier },
              // Check if HR or special username
              ...(loginIdentifier.toLowerCase() === 'hr' ? [{ role: 'HR_ADMIN' as const }] : []),
              // Check by employee profile ID if entered
              { employeeProfile: { id: loginIdentifier } },
            ],
          },
        });

        // Also fallback to search if login identifier is like NITP0021 or prefix
        if (!user && loginIdentifier.includes('@')) {
          user = await prisma.user.findUnique({
            where: { email: loginIdentifier.toLowerCase() },
          });
        }

        if (!user) return null;

        // Gate login on isActive
        if (!user.isActive) {
          throw new Error("DEACTIVATED");
        }

        const passwordMatch = bcrypt.compareSync(
          credentials.password as string,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teamId = user.teamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.teamId = token.teamId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
