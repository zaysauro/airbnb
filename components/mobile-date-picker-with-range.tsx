"use client"

import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type * as React from "react"
import type { DateRange } from "react-day-picker"

import { MobileCalendar } from "@/components/ui/mobile-calendar"
import { cn } from "@/lib/utils"

interface MobileDatePickerWithRangeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	date?: DateRange | undefined
	onDateSelect?: (date: DateRange | undefined) => void
}

export default function MobileDatePickerWithRange({
	className,
	date,
	onDateSelect
}: MobileDatePickerWithRangeProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<div className="text-sm text-muted-foreground">
				{date?.from ? (
					date.to ? (
						<>
							{format(date.from, "dd MMM yyyy", { locale: ptBR })} - {format(date.to, "dd MMM yyyy", { locale: ptBR })}
						</>
					) : (
						format(date.from, "dd MMM yyyy", { locale: ptBR })
					)
				) : (
					<span>Selecione um período</span>
				)}
			</div>
			<MobileCalendar
				mode="range"
				defaultMonth={date?.from}
				selected={date}
				onSelect={onDateSelect}
				numberOfMonths={1}
				disabled={{ before: addDays(new Date(), 0) }}
				className="rounded-md border"
			/>
		</div>
	)
}
