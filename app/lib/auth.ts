import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      age: number;
      phone: string;
      role: string;
      avatar?: string;
      region?: string;
      bio?: string;
      createdAt: Date;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email и пароль обязательны");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            throw new Error("Пользователь не найден");
          }

          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Неверный пароль");
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar || "",
            region: user.region || "",
            bio: user.bio || "",
          } as User;
        } catch (error) {
          console.error(error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            age: true,
            phone: true,
            role: true,
            avatar: true,
            region: true,
            bio: true,
            createdAt: true,
          }
        });

        if (user) {
          session.user = {
            id: user.id,
            email: user.email!,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar || undefined,
            region: user.region || undefined,
            bio: user.bio || undefined,
            createdAt: user.createdAt,
          };
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};