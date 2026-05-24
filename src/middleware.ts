import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAdminPath = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminPath && isAuth) {
      const userRole = token.role as string;
      if (userRole !== "admin" && userRole !== "sysadmin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Allow access to login, auth APIs, static assets, and the logo folder without authentication
  matcher: ["/((?!login|api/auth|api/export-pdf|_next/static|_next/image|favicon.ico|logo).*)"],
};
