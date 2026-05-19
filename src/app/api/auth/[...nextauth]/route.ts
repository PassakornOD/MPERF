
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import crypto from "crypto";
import { logSecurityEvent } from "@/lib/logger";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        const [rows]: any = await pool.query(
          "SELECT * FROM user WHERE username = ?",
          [credentials.username]
        );
        const user = rows[0];

        if (!user) {
          logSecurityEvent('Failed login attempt: User not found', { username: credentials.username });
          return null;
        }

        const hashedPassword = crypto.createHash('sha1').update(credentials.password).digest('hex');

        if (hashedPassword === user.password) {
          logSecurityEvent('Successful login', { username: credentials.username });
          // Map 'permission' field from DB to user object
          return { id: user.user_id.toString(), name: user.username, permission: user.permission };
        }
        
        logSecurityEvent('Failed login attempt: Incorrect password', { username: credentials.username });
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.permission = (user as any).permission;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).permission = token.permission;
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
