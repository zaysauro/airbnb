import { hasUsers, loginAction, setupAction, auth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const {userId} = await auth()
 if(userId) redirect("/dashboard")
 const existing = await hasUsers()
 const {error} = await searchParams
 return <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4"><div className="w-full max-w-md rounded-xl border bg-background p-8 shadow-sm">
 <h1 className="text-2xl font-bold">Cadena - Airbnb</h1>
 <p className="mt-2 text-sm text-muted-foreground">{existing ? "Acesse sua conta da imobiliária." : "Configure o primeiro administrador da imobiliária."}</p>
 {error && <p role="alert" className="mt-4 text-sm text-red-600">Verifique os dados informados. {existing ? "E-mail ou senha inválidos." : "Utilize um e-mail válido e senha de pelo menos 12 caracteres."}</p>}
 <form action={existing ? loginAction : setupAction} className="mt-6 grid gap-4">
 <label className="grid gap-1 text-sm font-medium">E-mail<input name="email" type="email" autoComplete="email" required className="rounded-md border px-3 py-2 bg-background"/></label>
 <label className="grid gap-1 text-sm font-medium">Senha<input name="password" type="password" minLength={existing?8:12} autoComplete={existing?"current-password":"new-password"} required className="rounded-md border px-3 py-2 bg-background"/></label>
 <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 font-medium">{existing?"Entrar":"Criar administrador"}</button>
 </form></div></main>
}
