import { Navbar } from "@/app/_components/Navbar"
import { addOperationTask, listOperationTasks, listTaskProperties, setOperationTaskStatus } from "@/lib/operation-tasks"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic="force-dynamic"
const kinds:{[key:string]:string}={limpeza:"Limpeza",checkin:"Check-in",checkout:"Check-out",manutencao:"Manutenção",vistoria:"Vistoria",outro:"Outro"}
const states:{[key:string]:string}={pendente:"Pendente",em_andamento:"Em andamento",concluida:"Concluída"}
export default async function Operations(){
 const {userId}=await auth();if(!userId)redirect("/login")
 const [tasks,items]=await Promise.all([listOperationTasks(),listTaskProperties()])
 return <div><Navbar/><main className="container mx-auto max-w-6xl px-4 py-8 space-y-8"><header><h1 className="text-3xl font-bold">Operação dos imóveis</h1><p className="text-muted-foreground mt-2">Organize limpezas, check-ins, check-outs, vistorias e manutenção. As atividades são internas e não alteram reservas no Airbnb.</p></header>
 <section className="rounded-xl border bg-card text-card-foreground p-5"><h2 className="text-lg font-semibold mb-4">Nova atividade</h2><form action={addOperationTask} className="grid gap-3 md:grid-cols-2">
 <label className="grid gap-1 text-sm">Imóvel<select name="propertyId" required className="rounded-md border bg-background text-foreground p-2">{items.map(x=><option key={x.id} value={x.id}>{x.name||x.url}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Tipo<select name="kind" className="rounded-md border bg-background text-foreground p-2">{Object.entries(kinds).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Atividade<input name="title" maxLength={140} required placeholder="Ex.: Limpeza após check-out" className="rounded-md border bg-background p-2"/></label>
 <label className="grid gap-1 text-sm">Prazo<input name="dueDate" type="date" className="rounded-md border bg-background text-foreground p-2"/></label>
 <label className="grid gap-1 text-sm md:col-span-2">Observações<textarea name="notes" maxLength={1500} rows={2} className="rounded-md border bg-background text-foreground p-2"/></label>
 <button disabled={!items.length} className="rounded-md bg-primary text-primary-foreground px-5 py-2 font-medium w-fit">Criar atividade</button></form></section>
 <section><h2 className="text-xl font-semibold mb-4">Atividades ({tasks.length})</h2><div className="grid gap-3">{tasks.length===0&&<p className="text-muted-foreground">Nenhuma atividade cadastrada.</p>}{tasks.map(t=><article key={t.id} className="rounded-xl border bg-card text-card-foreground p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><div className="flex flex-wrap gap-2 items-center"><span className="text-xs rounded bg-accent text-accent-foreground px-2 py-1">{kinds[t.kind]||t.kind}</span><span className="text-xs text-muted-foreground">{t.dueDate?new Date(t.dueDate+"T12:00:00").toLocaleDateString("pt-BR"):"Sem prazo"}</span></div><h3 className="font-semibold mt-2">{t.title}</h3><a className="text-sm text-primary underline" href={t.propertyUrl} target="_blank" rel="noopener noreferrer">{t.propertyName}</a>{t.notes&&<p className="text-sm text-muted-foreground mt-1">{t.notes}</p>}</div><form action={setOperationTaskStatus} className="flex gap-2"><input type="hidden" name="id" value={t.id}/><select name="status" defaultValue={t.status} aria-label="Status da atividade" className="rounded-md border bg-background text-foreground p-2 text-sm">{Object.entries(states).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><button className="rounded-md border px-3 text-sm hover:bg-accent">Salvar</button></form></article>)}</div></section></main></div>
}
