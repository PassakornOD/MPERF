
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import crypto from "crypto";

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

        if (!user) return null;

        // Hash the input password using SHA1 to match legacy database format
        const hashedPassword = crypto.createHash('sha1').update(credentials.password).digest('hex');

        if (hashedPassword === user.password) {
          return { id: user.user_id.toString(), name: user.username };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
