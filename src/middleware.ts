
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Allow access to login, auth APIs, static assets, and the logo folder without authentication
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo).*)"],
};
