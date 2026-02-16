import NextAuth from 'next-auth'
import Facebook from 'next-auth/providers/facebook'
import Twitter from 'next-auth/providers/twitter'
import Google from 'next-auth/providers/google'
import Strava from 'next-auth/providers/strava'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook,
    Twitter,
    Google,
    Strava({
      authorization: {
        params: {
          scope: 'read,read_all,activity:read_all,email',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
        token.id = profile?.id || account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.provider = token.provider as string
      if (session.user) {
        session.user.id = (token.id || token.sub) as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname.startsWith('/login')
      const isPublicApi = nextUrl.pathname.startsWith('/api/auth')

      if (isLoginPage || isPublicApi) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }

      return isLoggedIn
    },
  },
})