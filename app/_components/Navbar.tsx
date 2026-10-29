import { auth, logoutAction } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
export async function Navbar() {
 const { userId } = await auth()
 return <nav className="border-b sticky top-0 bg-background z-50"><div className="container mx-auto h-14 flex items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40 gap-8">
 <Link href="/" className="font-display text-xl font-bold">Cadena <span className="text-primary">- Airbnb</span></Link>
 <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Painel</Link>
 <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">Explorar</Link>
 <div className="ml-auto flex items-center gap-3"><ThemeToggle />{userId ? <form action={logoutAction}><button className="text-sm font-medium">Sair</button></form> : <Link href="/login" className="text-sm font-medium">Entrar</Link>}</div>
 </div></nav>
}
