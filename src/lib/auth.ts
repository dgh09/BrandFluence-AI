import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";

import { pool, queryOne } from "./db";
import { loginSchema } from "./validators";

/**
 * Configuración central de auth. TODO lo relacionado con sesiones vive aquí,
 * de forma que migrar a Supabase Auth (si algún día hace falta paridad total
 * con las apps nativas) toque este fichero y poco más.
 *
 * Estrategia JWT (no database sessions) a propósito:
 *   1. Credentials provider la exige.
 *   2. El día que existan las apps iOS/Android van a necesitar un token
 *      portable, no una cookie de sesión.
 */

type UserType = "creator" | "brand";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType: UserType | null;
    } & DefaultSession["user"];
  }
  interface User {
    userType?: UserType | null;
  }
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  password_hash: string | null;
  user_type: UserType | null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await queryOne<UserRow>(
          `SELECT id, name, email, image, password_hash, user_type
             FROM users
            WHERE email = $1`,
          [parsed.data.email.toLowerCase()],
        );

        // Cuenta inexistente o creada vía Google (sin contraseña).
        // Comparamos igualmente contra un hash dummy para que el tiempo de
        // respuesta no revele si el email existe.
        if (!user?.password_hash) {
          await bcrypt.compare(parsed.data.password, DUMMY_HASH);
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          userType: user.user_type,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.userType = user.userType ?? null;
      }

      // El user_type se elige en el onboarding, después del alta por Google.
      // Al refrescar la sesión lo releemos para no dejar el token obsoleto.
      if (trigger === "update" || (token.id && token.userType == null)) {
        const row = await queryOne<{ user_type: UserType | null }>(
          `SELECT user_type FROM users WHERE id = $1`,
          [token.id],
        );
        token.userType = row?.user_type ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.userType = (token.userType as UserType | null) ?? null;
      return session;
    },
  },
});

/** Hash de una contraseña arbitraria, para igualar tiempos en logins fallidos. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.9pQe9jFkFbFZ8bMfoiFdgWQhKGFCVzO";

/** Coste bcrypt. 12 es el equilibrio razonable en serverless (~250ms). */
export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
