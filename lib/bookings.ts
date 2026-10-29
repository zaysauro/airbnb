"use server"

import { getHostEmailAddress } from "@/lib/clerk"
import { FROM_EMAIL, getPostmarkClient } from "@/lib/postmark"
import type { DateRange } from "react-day-picker"

interface BookingData {
	propertyId: string
	email: string
	guests: number
	dates: DateRange
	pricePerNight: number
}

export async function createBooking(data: BookingData) {
	const postmark = getPostmarkClient()
	if (!postmark) throw new Error("Booking requests unavailable: Postmark is not configured")
	const hostEmail = await getHostEmailAddress(data.propertyId)

	// Send email to host using Postmark directly
	await postmark.sendEmail({
		From: FROM_EMAIL,
		To: hostEmail,
		Subject: "Nova solicitação de reserva",
		TextBody: `
            Nova solicitação de reserva:
            E-mail do hóspede: ${data.email}
            Hóspedes: ${data.guests}
            Datas: ${data.dates.from?.toLocaleDateString()} - ${data.dates.to?.toLocaleDateString()}
            Preço por diária: $${data.pricePerNight}
        `
	})
}
