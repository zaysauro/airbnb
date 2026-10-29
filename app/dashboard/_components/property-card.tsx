"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from "@/components/ui/tooltip"
import type { VisualProperty } from "@/lib/properties"
import { blockedDates, deleteProperty, fetchListingPhoto, saveListingExtras, updatePropertyPrice } from "@/lib/properties"
import { Home, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

function PriceInput({
	propertyId,
	initialPrice
}: {
	propertyId: string
	initialPrice: number
}) {
	const [localPrice, setLocalPrice] = useState(initialPrice)

	const handlePriceUpdate = (newPrice: number) => {
		if (!Number.isNaN(newPrice) && newPrice !== initialPrice) {
			updatePropertyPrice(propertyId, newPrice)
			setLocalPrice(newPrice)
		}
	}

	return (
		<Input
			type="number"
			min="0"
			value={localPrice || ""}
			onChange={(e) => {
				e.stopPropagation()
				setLocalPrice(Number(e.target.value))
			}}
			onBlur={() => handlePriceUpdate(localPrice)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.currentTarget.blur()
				}
			}}
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			onFocus={(e) => e.stopPropagation()}
			className="w-full"
		/>
	)
}

export function PropertyCard({ property }: { property: VisualProperty }) {
	const router = useRouter()
	const [settingsOpen,setSettingsOpen]=useState(false)
	const [image,setImage]=useState(property.coverImageUrl ?? "")
	const [summary,setSummary]=useState(property.listingSummary ?? "")
	const [ical,setIcal]=useState("")
	const [message,setMessage]=useState("")
	const [blocked,setBlocked]=useState<string[]|null>(null)
	const [busy,setBusy]=useState(false)
	async function action(work:()=>Promise<unknown>){setBusy(true);setMessage("");try{await work();setMessage("Dados atualizados.");router.refresh()}catch(e){setMessage(e instanceof Error?e.message:"Não foi possível atualizar.")}finally{setBusy(false)}}

	const handleCardClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement
		if (target.closest("button") || target.closest("input")) {
			return
		}

		if (property.status === "loaded") {
			window.open(property.url, "_blank")
		}
	}

	return (
		<div
			onClick={handleCardClick}
		>
			<Card
				className={`${
					property.status === "loaded"
						? "cursor-pointer hover:shadow-lg transition-shadow"
						 : "border-orange-200 dark:border-orange-950"
				}`}
			>
				<CardContent className="p-6">
					<div className="flex flex-col gap-4">
						{property.coverImageUrl ? <img src={property.coverImageUrl} className="aspect-video w-full object-cover rounded-md" alt="Foto deste imóvel no Airbnb" referrerPolicy="no-referrer"/> : <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">Foto não disponível — importar imagem do anúncio</div>}
						{/* Title, Location, and Top Buttons */}
						<div className="flex justify-between items-start">
							<div>
								<h3 className="font-semibold">
									{property.status === "loaded"
										? property.title
										: (property.catalogTitle || "Aguardando importação dos detalhes")}
								</h3>
								<p className="text-sm text-gray-500">
									{property.status === "loaded"
										? property.location
										: (property.catalogLocation || "Detalhes ainda não importados")}
								</p>
							</div>
							<TooltipProvider>
								<div className="flex gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation()
													window.open(property.url, "_blank")
												}}
												className="text-[#FF385C] hover:text-[#FF385C] hover:bg-[#FF385C]/10"
											>
												<Home className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Abrir anúncio no Airbnb</p>
										</TooltipContent>
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={async (e) => {
													e.stopPropagation()
													if (
														window.confirm(
															"Tem certeza de que deseja excluir este imóvel?"
														)
													) {
														await deleteProperty(property.id)
														router.refresh()
													}
												}}
												disabled={false}
												className={
													""
												}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Excluir imóvel</p>
										</TooltipContent>
									</Tooltip>
								</div>
							</TooltipProvider>
						</div>

						<div className="flex flex-wrap gap-2"><a href={property.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground">Abrir no Airbnb ↗</a><Button size="sm" variant="outline" onClick={()=>setSettingsOpen(v=>!v)}>{settingsOpen?"Fechar":"Fotos e calendário"}</Button></div>
{property.listingSummary && <p className="text-sm text-muted-foreground">{property.listingSummary}</p>}
{settingsOpen && <div className="space-y-2 border-t pt-3" onClick={e=>e.stopPropagation()}><p className="text-sm font-medium">Foto do anúncio</p><Button size="sm" variant="outline" disabled={busy} onClick={()=>action(async()=>{const r=await fetchListingPhoto(property.id);setImage(r.image)})}>Buscar foto oficial</Button><Input value={image} onChange={e=>setImage(e.target.value)} placeholder="URL da foto do Airbnb (muscache.com)"/><textarea className="w-full rounded-md border border-input bg-background text-foreground p-2 text-sm" rows={3} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Informações e descrição do imóvel"/><p className="text-sm font-medium">Calendário do Airbnb</p><p className="text-xs text-muted-foreground">No Airbnb: Calendário → Disponibilidade → Conectar calendários → Exportar calendário. Copie o link iCal.</p><Input type="url" value={ical} onChange={e=>setIcal(e.target.value)} placeholder={property.calendarConnected?"iCal conectado: cole outro para substituir":"Cole o link iCal (.ics) do Airbnb"}/><Button size="sm" disabled={busy} onClick={()=>action(()=>saveListingExtras(property.id,image,summary,ical))}>Salvar informações</Button><Button size="sm" variant="outline" disabled={busy||!property.calendarConnected} onClick={()=>action(async()=>{const result=await blockedDates(property.id);setBlocked(result.blocked)})}>Consultar dias bloqueados</Button>{blocked && <div className="text-xs text-muted-foreground"><strong>{blocked.length} noites bloqueadas no calendário.</strong><p>Outras datas não são disponibilidade confirmada. Verifique no Airbnb.</p><div className="max-h-28 overflow-auto">{blocked.slice(0,60).map(d=><span key={d} className="inline-block rounded bg-muted p-1 m-0.5">{d.split("-").reverse().join("/")}</span>)}</div></div>}{message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}</div>}
						{/* Stats Grid */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-500">Visualizações</p>
								<p className="text-lg font-semibold">
									{property.status === "loaded" ? property.views : "—"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-500">Consultas</p>
								<p className="text-lg font-semibold">
									{property.status === "loaded" ? property.inquiries : "—"}
								</p>
							</div>
						</div>

						{/* Price Input */}
						<div>
							<p className="text-sm text-gray-500">Preço por diária</p>
							<PriceInput
								propertyId={property.id}
								initialPrice={property.pricePerNight}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
