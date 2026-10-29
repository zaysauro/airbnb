"use server"
import "server-only"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { properties } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import postgres from "postgres"
import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"

function client() {
 const url=process.env.POSTGRES_URL
 if(!url)throw new Error("Banco não configurado")
 return postgres(url,{max:1})
}
async function currentUser(){
 const {userId}=await auth()
 if(!userId)throw new Error("Acesso negado")
 return userId
}
export async function listOperationTasks(){
 const owner=await currentUser()
 const sqlClient=client()
 try{
 const rows=await sqlClient`SELECT t.id, t.property_id, t.kind, t.title, t.notes, t.due_date::text AS due_date, t.status, p.catalog_title, p.url FROM property_tasks t JOIN properties p ON p.id=t.property_id WHERE t.owner_id=${owner} AND p.clerk_id=${owner} ORDER BY CASE WHEN t.status='concluida' THEN 1 ELSE 0 END, t.due_date NULLS LAST, t.created_at DESC LIMIT 200`
 return rows.map(r=>({id:String(r.id),propertyId:String(r.property_id),kind:String(r.kind),title:String(r.title),notes:String(r.notes),dueDate:r.due_date?String(r.due_date):null,status:String(r.status),propertyName:String(r.catalog_title||"Imóvel cadastrado"),propertyUrl:String(r.url)}))
 }finally{await sqlClient.end()}
}
export async function listTaskProperties(){
 const owner=await currentUser()
 return db.select({id:properties.id,name:properties.catalogTitle,url:properties.url}).from(properties).where(eq(properties.clerkId,owner))
}
export async function addOperationTask(form:FormData){
 const owner=await currentUser()
 const propertyId=String(form.get("propertyId")||"")
 const title=String(form.get("title")||"").trim()
 const kind=String(form.get("kind")||"outro")
 const dueDate=String(form.get("dueDate")||"")
 const notes=String(form.get("notes")||"").slice(0,1500)
 if(!title||title.length>140||!["limpeza","checkin","checkout","manutencao","vistoria","outro"].includes(kind)|| (dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)))throw Error("Dados inválidos")
 const sqlClient=client()
 try{
 await sqlClient`INSERT INTO property_tasks (id,property_id,owner_id,kind,title,notes,due_date) SELECT ${randomUUID()},p.id,${owner},${kind},${title},${notes},${dueDate||null}::date FROM properties p WHERE p.id=${propertyId} AND p.clerk_id=${owner}`
 }finally{await sqlClient.end()}
 revalidatePath("/operacao")
}
export async function setOperationTaskStatus(form:FormData){
 const owner=await currentUser()
 const id=String(form.get("id")||"")
 const status=String(form.get("status")||"")
 if(!["pendente","em_andamento","concluida"].includes(status))throw Error("Status inválido")
 const sqlClient=client()
 try{await sqlClient`UPDATE property_tasks SET status=${status} WHERE id=${id} AND owner_id=${owner}`}finally{await sqlClient.end()}
 revalidatePath("/operacao")
}
