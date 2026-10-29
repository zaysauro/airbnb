"use client"
import { useState } from "react"
import { importAllPropertyPhotos } from "@/lib/properties"
import { useRouter } from "next/navigation"
export function BulkPhotoImport(){
 const [busy,setBusy]=useState(false),[result,setResult]=useState("")
 const router=useRouter()
 async function sync(){setBusy(true);setResult("");try{const r=await importAllPropertyPhotos();setResult(r.imported+" fotos importadas, "+r.failed+" não encontradas, "+r.skipped+" já cadastradas.");router.refresh()}catch(e){setResult(e instanceof Error?e.message:"Falha na importação")}finally{setBusy(false)}}
 return <div className="flex flex-wrap items-center gap-3"><button disabled={busy} onClick={sync} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy?"Buscando fotos dos anúncios...":"Importar fotos de todos os anúncios"}</button>{result&&<span role="status" className="text-sm text-muted-foreground">{result}</span>}</div>
}
