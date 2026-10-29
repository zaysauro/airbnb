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
import { deleteProperty, updatePropertyPrice } from "@/lib/properties"
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
