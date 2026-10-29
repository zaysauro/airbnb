"use server"
import "server-only"
import { auth } from "@/lib/auth"
import postgres from "postgres"
import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
const sqlClient=()=>{if(!process.env.POSTGRES_URL)throw Error("Banco não configurado");return postgres(process.env.POSTGRES_URL,{max:1})}
async function user(){const {userId}=await auth();if(!userId)throw Error("Acesso negado");return userId}
export async function reservationData(){
 const owner=await user(),sql=sqlClient()
 try {
 const [properties,reservations]=await Promise.all([
 sql`SELECT id, COALESCE(catalog_title, url) AS name,url FROM properties WHERE clerk_id=${owner} ORDER BY name`,
 sql`SELECT r.id,r.property_id,r.guest_name,r.check_in::text AS check_in,r.check_out::text AS check_out,r.status,r.source,r.notes,COALESCE(p.catalog_title,p.url) AS property_name FROM property_reservations r JOIN properties p ON p.id=r.property_id WHERE r.owner_id=${owner} AND p.clerk_id=${owner} ORDER BY r.check_in DESC LIMIT 300`])
 return {properties:properties.map(x=>({id:String(x.id),name:String(x.name),url:String(x.url)})),reservations:reservations.map(x=>({id:String(x.id),propertyId:String(x.property_id),guest:String(x.guest_name),checkIn:String(x.check_in),checkOut:String(x.check_out),status:String(x.status),source:String(x.source),notes:String(x.notes),name:String(x.property_name)}))}
 }finally{await sql.end()}
}
export async function addReservation(form:FormData) {
 const owner=await user(),sql=sqlClient()
 const property=String(form.get("property")||""),guest=String(form.get("guest")||"").trim().slice(0,120)
 const start=String(form.get("checkin")||""),end=String(form.get("checkout")||"")
 const source=String(form.get("source")||"manual"),notes=String(form.get("notes")||"").slice(0,1000)
 if(!guest||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>=end||!["manual","airbnb","outro"].includes(source))throw Error("Confira os dados da reserva")
 try {
 await sql.begin(async tx=>{
 await tx`SELECT pg_advisory_xact_lock(hashtext(${property}))`
 const owns=await tx`SELECT id FROM properties WHERE id=${property} AND clerk_id=${owner}`
 if(!owns.length)throw Error("Imóvel não encontrado")
 const overlaps=await tx`SELECT id FROM property_reservations WHERE property_id=${property} AND status <> 'cancelada' AND check_in < ${end}::date AND check_out > ${start}::date LIMIT 1`
 if(overlaps.length)throw Error("Já existe uma reserva interna nesse período")
 await tx`INSERT INTO property_reservations(id,property_id,owner_id,guest_name,check_in,check_out,source,notes) VALUES (${randomUUID()},${property},${owner},${guest},${start}::date,${end}::date,${source},${notes})`
 })
 }finally{await sql.end()}
 revalidatePath("/reservas")
}
export async function changeReservationStatus(form:FormData){
 const owner=await user(),sql=sqlClient(),id=String(form.get("id")||""),status=String(form.get("status")||"")
 if(!["confirmada","pendente","cancelada"].includes(status))throw Error("Status inválido")
 try{await sql`UPDATE property_reservations SET status=${status} WHERE id=${id} AND owner_id=${owner}`}finally{await sql.end()}
 revalidatePath("/reservas")
}
