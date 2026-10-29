import { ServerClient } from "postmark"
export const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "contact@bjornpagen.com"
export function getPostmarkClient() {
 const token = process.env.POSTMARK_API_TOKEN
 if (!token) return null
 return new ServerClient(token)
}
