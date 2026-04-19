import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      username: string;
      role: string;
    };
  }

  interface User {
    role?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string;
  }
}
