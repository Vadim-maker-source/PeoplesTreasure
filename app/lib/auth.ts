import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import YandexProvider from "next-auth/providers/yandex";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { consumeRateLimit, resetRateLimit } from "./rate-limit";

const dummyPasswordHash = "$2b$12$QIKiKM4ZxmrKKb.v0ds0Ouu3hoIKwwvD2WjbbE5UWHvGWp.cW4wBG";
const authSecret = process.env.NEXTAUTH_SECRET;
if (!authSecret || authSecret.length < 32) throw new Error("NEXTAUTH_SECRET должен содержать не менее 32 символов");

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

const customAdapter = {
  ...PrismaAdapter(prisma),

  createUser: async (data: any) => {
    const { name, email, emailVerified, image, ...rest } = data;

    let firstName = '';
    let lastName = '';

    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    const user = await prisma.user.create({
      data: {
        email: email!,
        firstName,
        lastName,
        age: 0,
        phone: '',
        role: 'USER',
        avatar: image || null,
        region: '',
        bio: '',
        emailVerified: emailVerified || null,
        ...rest,
      },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      phone: user.phone,
      role: user.role,
      image: user.avatar,
    };
  },

  getUser: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      phone: user.phone,
      role: user.role,
      image: user.avatar,
    };
  },

  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      phone: user.phone,
      role: user.role,
      image: user.avatar,
    };
  },

  updateUser: async (data: any) => {
    const { id, name, ...rest } = data;

    let firstName = '';
    let lastName = '';

    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...rest,
      },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      phone: user.phone,
      role: user.role,
      image: user.avatar,
    };
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
      async profile(profile) {
        return {
          id: profile.id,
          email: profile.default_email,
          name: profile.real_name || profile.display_name,
          firstName: profile.first_name || profile.real_name?.split(' ')[0] || '',
          lastName: profile.last_name || profile.real_name?.split(' ')[1] || '',
          age: 0,
          phone: profile.default_phone?.number || '',
          role: 'USER',
          avatar: profile.default_avatar_id
            ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
            : null,
          region: '',
          bio: '',
        };
      },
    }),

    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request): Promise<User | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email.trim().toLowerCase();
          const forwardedFor = request.headers?.["x-forwarded-for"];
          const ip = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : forwardedFor?.split(",")[0]?.trim() || request.headers?.["x-real-ip"] || "local";
          const [emailLimit, ipLimit] = await Promise.all([
            consumeRateLimit("login-email", email, 5, 15 * 60 * 1000),
            consumeRateLimit("login-ip", String(ip), 30, 15 * 60 * 1000),
          ]);
          if (!emailLimit.allowed || !ipLimit.allowed) return null;

          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            await compare(credentials.password, dummyPasswordHash);
            return null;
          }

          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          await resetRateLimit("login-email", email);

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
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }

      if (token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (currentUser) token.role = currentUser.role;
      }

      if (account) {
        token.accessToken = account.access_token;
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
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
  debug: false,
};
