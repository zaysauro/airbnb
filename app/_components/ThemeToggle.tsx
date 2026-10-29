"use client"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
export function ThemeToggle() {
 const [dark, setDark] = useState(false)
 useEffect(() => { setDark(document.documentElement.classList.contains("dark")) }, [])
 function toggle() {
  const next = !document.documentElement.classList.contains("dark")
  document.documentElement.classList.toggle("dark", next)
  try { localStorage.setItem("cadena-theme", next ? "dark" : "light") } catch {}
  setDark(next)
 }
 return <button type="button" onClick={toggle} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"} title={dark ? "Modo claro" : "Modo escuro"} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
}
