"use server"
import "server-only"
import postgres from "postgres"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual, createHash, randomUUID } from "node:crypto"
import { promisify } from "node:util"
const scrypt = promisify(nodeScrypt)
const COOKIE = "cadena_session"
function database() {
 const url = process.env.POSTGRES_URL
 if (!url) throw new Error("POSTGRES_URL is not configured")
 return postgres(url, { max: 1, idle_timeout: 5 })
}
async function passwordHash(value: string) {
 const salt = randomBytes(16).toString("hex")
 const hash = await scrypt(value, salt, 64) as Buffer
 return salt + ":" + hash.toString("hex")
}
async function passwordMatches(value: string, stored: string) {
 const [salt, h] = stored.split(":")
 if (!salt || !h || h.length !== 128) return false
 const candidate = await scrypt(value, salt, 64) as Buffer
 return timingSafeEqual(candidate, Buffer.from(h, "hex"))
}
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")
export async function auth() {
 const token = (await cookies()).get(COOKIE)?.value
 if (!token || !/^[a-f0-9]{64}$/.test(token)) return { userId: null as string | null }
 const sql = database()
 try {
  const rows = await sql`SELECT user_id FROM app_sessions WHERE token_hash = ${hashToken(token)} AND expires_at > now() LIMIT 1`
  return { userId: rows.length ? String(rows[0].user_id) : null }
 } finally { await sql.end() }
}
async function createSession(userId: string) {
 const token = randomBytes(32).toString("hex")
 const sql = database()
 try { await sql`INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES (${hashToken(token)}, ${userId}, now() + interval '7 days')` }
 finally { await sql.end() }
 ;(await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
}
export async function hasUsers() {
 const sql = database()
 try { const rows = await sql`SELECT EXISTS(SELECT 1 FROM app_users) AS present`; return Boolean(rows[0].present) }
 finally { await sql.end() }
}
export async function loginAction(formData: FormData) {
 const email = String(formData.get("email") ?? "").trim().toLowerCase()
 const password = String(formData.get("password") ?? "")
 if (!email || password.length < 8) redirect("/login?error=invalid")
 const sql = database()
 let userId: string | null = null
 try {
  const rows = await sql`SELECT id, password_hash FROM app_users WHERE email = ${email} LIMIT 1`
  if (rows.length && await passwordMatches(password, String(rows[0].password_hash))) userId = String(rows[0].id)
 } finally { await sql.end() }
 if (!userId) redirect("/login?error=invalid")
 await createSession(userId)
 redirect("/dashboard")
}
export async function setupAction(formData: FormData) {
 const email = String(formData.get("email") ?? "").trim().toLowerCase()
 const password = String(formData.get("password") ?? "")
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) redirect("/login?error=setup")
 const sql = database()
 let id: string | null = null
 try {
  const rows = await sql.begin(async tx => {
   await tx`SELECT pg_advisory_xact_lock(8151642)`
   const existing = await tx`SELECT id FROM app_users LIMIT 1`
   if (existing.length) return []
   const identifier = randomUUID()
   const hash = await passwordHash(password)
   return tx`INSERT INTO app_users (id,email,password_hash) VALUES (${identifier},${email},${hash}) RETURNING id`
  })
  if (rows.length) id = String(rows[0].id)
 } finally { await sql.end() }
 if (!id) redirect("/login")
 await createSession(id)
 redirect("/dashboard")
}
export async function logoutAction() {
 const cookieStore = await cookies()
 const token = cookieStore.get(COOKIE)?.value
 if (token && /^[a-f0-9]{64}$/.test(token)) {
  const sql = database()
  try { await sql`DELETE FROM app_sessions WHERE token_hash = ${hashToken(token)}` }
  finally { await sql.end() }
 }
 cookieStore.delete(COOKIE)
 redirect("/login")
}
