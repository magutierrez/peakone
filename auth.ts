import NextAuth from 'next-auth'
import Facebook from 'next-auth/providers/facebook'
import Twitter from 'next-auth/providers/twitter'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook,
    Twitter, // Auth.js supports X via the Twitter provider
    Google,
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
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
