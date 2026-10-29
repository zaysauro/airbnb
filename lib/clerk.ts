import "server-only"
import { properties } from "@/db/schema"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import postgres from "postgres"
export async function getUserEmailAddresses(userId: string) {
 const connection = process.env.POSTGRES_URL
 if (!connection) throw new Error("Database not configured")
 const sql = postgres(connection, { max: 1 })
 try {
  const users = await sql`SELECT email FROM app_users WHERE id = ${userId} LIMIT 1`
  return users.map((user) => String(user.email))
 } finally { await sql.end() }
}
export async function getHostEmailAddress(propertyId: string) {
 const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
 if (!property) throw new Error("Property not found")
 const emails = await getUserEmailAddresses(property.clerkId)
 if (!emails[0]) throw new Error("Property owner has no email")
 return emails[0]
}
