import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Guardar el google_id en el token al primer login
      if (account && profile) {
        token.google_id = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      // Pasar google_id a la sesión del cliente
      if (session.user) {
        (session.user as Record<string, unknown>).google_id = token.google_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/ingreso",
  },
});

export { handler as GET, handler as POST };
