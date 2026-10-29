import { Navbar } from "@/app/_components/Navbar"
import { auth } from "@/lib/auth"
import { addReservation, changeReservationStatus, reservationData } from "@/lib/reservation-management"
import { redirect } from "next/navigation"
export const dynamic="force-dynamic"
export default async function Reservations(){
 const {userId}=await auth();if(!userId)redirect("/login")
 const {properties,reservations}=await reservationData()
 return <div><Navbar/><main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
 <header><h1 className="text-3xl font-bold">Gestão de reservas</h1><p className="text-muted-foreground mt-2">Registre reservas e bloqueie conflitos internos. Dados inseridos aqui não são enviados ao Airbnb; confirme disponibilidade no anúncio ou iCal.</p></header>
 <section className="rounded-xl border bg-card text-card-foreground p-5"><h2 className="text-xl font-semibold mb-4">Registrar reserva</h2>
 <form action={addReservation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <label className="text-sm grid gap-1">Imóvel<select name="property" required className="rounded-md border bg-background text-foreground p-2">{properties.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
 <label className="text-sm grid gap-1">Nome de referência do hóspede<input required maxLength={120} name="guest" placeholder="Nome ou código da reserva" className="rounded-md border bg-background p-2"/></label>
 <label className="text-sm grid gap-1">Check-in<input required type="date" name="checkin" className="rounded-md border bg-background p-2"/></label>
 <label className="text-sm grid gap-1">Check-out<input required type="date" name="checkout" className="rounded-md border bg-background p-2"/></label>
 <label className="text-sm grid gap-1">Origem<select name="source" className="rounded-md border bg-background p-2"><option value="manual">Direta / manual</option><option value="airbnb">Airbnb (registro manual)</option><option value="outro">Outro canal</option></select></label>
 <label className="text-sm grid gap-1">Observações<input name="notes" maxLength={1000} className="rounded-md border bg-background p-2"/></label>
 <button disabled={!properties.length} className="rounded-md bg-primary text-primary-foreground px-5 py-2 font-medium w-fit">Salvar reserva</button>
 </form></section>
 <section className="space-y-3"><h2 className="text-xl font-semibold">Reservas registradas ({reservations.length})</h2>
 {reservations.length===0&&<p className="text-muted-foreground">Nenhuma reserva interna registrada.</p>}
 {reservations.map(x=><article key={x.id} className="rounded-xl border bg-card text-card-foreground p-4 flex flex-wrap justify-between gap-4"><div className="space-y-1"><h3 className="font-semibold">{x.name}</h3><p>{x.guest}</p><p className="text-sm text-muted-foreground">{x.checkIn.split("-").reverse().join("/")} a {x.checkOut.split("-").reverse().join("/")}</p><p className="text-xs text-muted-foreground">{x.source==="airbnb"?"Airbnb (manual)":x.source==="manual"?"Direta/manual":"Outro canal"} · {x.notes}</p></div>
 <form action={changeReservationStatus} className="flex gap-2 items-center"><input type="hidden" name="id" value={x.id}/><select name="status" aria-label="Status da reserva" defaultValue={x.status} className="rounded-md border bg-background text-foreground p-2"><option value="confirmada">Confirmada</option><option value="pendente">Pendente</option><option value="cancelada">Cancelada</option></select><button className="rounded-md border px-3 py-2 text-sm">Salvar</button></form></article>)}
 </section></main></div>
}
