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
      async authorize(credentials) {
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
          
          // Force 'admin' role for sysreport and mfadmin to grant superuser privileges
          let assignedRole = user.role;
          if (['sysreport', 'mfadmin'].includes(user.username)) {
            assignedRole = 'admin';
          }

          return { 
            id: user.user_id.toString(), 
            name: user.username, 
            username: user.username,
            permission: user.permission, 
            role: assignedRole 
          };
        }

        logSecurityEvent('Failed login attempt: Incorrect password', { username: credentials.username });
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.permission = (user as any).permission;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).permission = token.permission;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 3600,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
