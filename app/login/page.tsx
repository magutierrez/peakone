'use client'

import { signIn } from "next-auth/react"
import { Mountain, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mountain className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Bienvenido a RouteWeather</CardTitle>
            <CardDescription>
              Inicia sesión para analizar tus rutas y ver el pronóstico meteorológico detallado.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button 
            variant="outline" 
            className="h-12 border-border bg-card hover:bg-accent"
            onClick={() => signIn("google", { redirectTo: "/" })}
          >
            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Continuar con Google
          </Button>

          <Button 
            variant="outline" 
            className="h-12 border-border bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
            onClick={() => signIn("facebook", { redirectTo: "/" })}
          >
            <Facebook className="mr-2 h-5 w-5 fill-current" />
            Continuar con Facebook
          </Button>

          <Button 
            variant="outline" 
            className="h-12 border-border bg-black text-white hover:bg-black/90"
            onClick={() => signIn("twitter", { redirectTo: "/" })}
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 7.717 8.502 11.25h-6.657l-5.214-6.817L4.99 21.25H1.68l7.73-8.235L1.25 2.25h6.826l4.717 6.176L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"></path>
            </svg>
            Continuar con X (Twitter)
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center">
          <p className="text-xs text-muted-foreground px-8 leading-relaxed">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}