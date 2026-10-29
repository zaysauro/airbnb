"use server"

import type { Listing } from "@/data/types"
import { type NewProperty, properties } from "@/db/schema"
import { auth } from "@/lib/auth"
import { desc, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import "server-only"
import { z } from "zod"
import { queueScraping } from "./apify"
import { db } from "./db"

// TODO: lock this down to only allow airbnb.com/rooms/ URLs
// Reuse the same URL validation schema
const urlSchema = z
	.string()
	.url()
	.includes("airbnb.com/rooms/")
	.regex(/airbnb\.com\/rooms\/\d+/, "Must be a valid Airbnb listing URL")

export async function createProperty(url: string) {
	// Validate the URL again on server-side
	const validatedUrl = urlSchema.parse(url)

	// Get the authenticated user
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")

	// Prepare the new property data
	const newProperty: NewProperty = {
		id: nanoid(),
		clerkId: userId,
		url: validatedUrl,
		listingData: null
	}

	// First insert into database
	await db.insert(properties).values(newProperty)

	// Then queue scraping
	if (process.env.APIFY_API_TOKEN && process.env.WEBHOOK_SECRET && process.env.VERCEL_URL) {
		await queueScraping(validatedUrl, newProperty.id)
	}

	return { success: true }
}

export type VisualProperty = {
	id: string
	url: string
	pricePerNight: number
	coverImageUrl?: string | null
	listingSummary?: string | null
	calendarConnected?: boolean
	catalogTitle?: string | null
	catalogLocation?: string | null
} & (
	| { status: "pending" }
	| {
			status: "loaded"
			title: string
			location: string
			views: number
			inquiries: number
	  }
)

export async function getProperties(): Promise<VisualProperty[]> {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")

	const results = await db
		.select({
			id: properties.id,
			url: properties.url,
			catalogTitle: properties.catalogTitle,
			catalogLocation: properties.catalogLocation,
			coverImageUrl: properties.coverImageUrl,
			listingSummary: properties.listingSummary,
			calendarConnected: sql<boolean>`${properties.icalUrl} IS NOT NULL`,
			title: sql<
				string | null
			>`(${properties.listingData}::json->'data'->>'h1Title')`,
			location: sql<
				string | null
			>`(${properties.listingData}::json->'data'->'overview'->>'location')`,
			views: properties.views,
			inquiries: properties.inquiries,
			hasListingData: sql<boolean>`${properties.listingData} IS NOT NULL`,
			pricePerNight: properties.pricePerNight
		})
		.from(properties)
		.where(eq(properties.clerkId, userId))
		.orderBy(desc(properties.createdAt))

	return results.map((result) => {
		if (!result.hasListingData) {
			return {
				id: result.id,
				url: result.url,
				pricePerNight: result.pricePerNight,
				catalogTitle: result.catalogTitle,
				catalogLocation: result.catalogLocation,
				coverImageUrl: result.coverImageUrl,
				listingSummary: result.listingSummary,
				calendarConnected: result.calendarConnected,
				status: "pending" as const
			}
		}

		return {
			status: "loaded" as const,
			catalogTitle: result.catalogTitle,
			catalogLocation: result.catalogLocation,
			coverImageUrl: result.coverImageUrl,
			listingSummary: result.listingSummary,
			calendarConnected: result.calendarConnected,
			id: result.id,
			url: result.url,
			title: result.title ?? "",
			location: result.location ?? "",
			views: result.views,
			inquiries: result.inquiries,
			pricePerNight: result.pricePerNight
		}
	})
}

export async function deleteProperty(propertyId: string) {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")

	await db
		.delete(properties)
		.where(
			sql`${properties.id} = ${propertyId} AND ${properties.clerkId} = ${userId}`
		)

	return { success: true }
}

export type ExploreProperty = {
	id: string
	title: string
	location: string
	propertyType: string
	capacity: number
	rating: number | null
	pricePerNight: number
	amenityCount: number
	mainImage: string
	stats: {
		views: number
		inquiries: number
	}
}

export async function getExploreProperties(): Promise<ExploreProperty[]> {
	const results = await db
		.select({
			id: properties.id,
			title: sql<string>`(${properties.listingData}::json->'data'->>'h1Title')`,
			location: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'location')`,
			propertyType: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'propertyType')`,
			capacity: sql<number>`(${properties.listingData}::json->'data'->'overview'->>'capacity')`,
			rating: sql<number>`(${properties.listingData}::json->'data'->'overview'->>'rating')`,
			amenityCount: sql<number>`(${properties.listingData}::json->'data'->'amenities'->>'count')`,
			mainImage: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'imageUrl')`,
			views: properties.views,
			inquiries: properties.inquiries,
			pricePerNight: properties.pricePerNight
		})
		.from(properties)
		.where(sql`${properties.listingData} IS NOT NULL`)
		.orderBy(desc(properties.createdAt))

	return results.map((result) => ({
		id: result.id,
		title: result.title ?? "Imóvel sem título",
		location: result.location ?? "Localização não informada",
		propertyType: result.propertyType ?? "Property",
		capacity: result.capacity ?? 1,
		rating: result.rating,
		amenityCount: result.amenityCount ?? 0,
		mainImage: result.mainImage,
		pricePerNight: result.pricePerNight,
		stats: {
			views: result.views,
			inquiries: result.inquiries
		}
	}))
}

export async function incrementPropertyViews(propertyId: string) {
	await db
		.update(properties)
		.set({
			views: sql`${properties.views} + 1`
		})
		.where(eq(properties.id, propertyId))
}

export async function incrementPropertyInquiries(propertyId: string) {
	await db
		.update(properties)
		.set({
			inquiries: sql`${properties.inquiries} + 1`
		})
		.where(eq(properties.id, propertyId))
}

export async function updatePropertyPrice(propertyId: string, price: number) {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")

	await db
		.update(properties)
		.set({ pricePerNight: price })
		.where(
			sql`${properties.id} = ${propertyId} AND ${properties.clerkId} = ${userId}`
		)

	return { success: true }
}

export async function getPropertyPrice(propertyId: string): Promise<number> {
	const result = await db
		.select({ pricePerNight: properties.pricePerNight })
		.from(properties)
		.where(eq(properties.id, propertyId))
		.limit(1)

	return result[0]?.pricePerNight ?? 0
}

export type ListingWithPrice = {
	data: Listing["data"]
	pricePerNight: number
}

export async function getListing(id: string): Promise<ListingWithPrice | null> {
	const property = await db
		.select({
			listingData: properties.listingData,
			pricePerNight: properties.pricePerNight
		})
		.from(properties)
		.where(eq(properties.id, id))
		.limit(1)
		.then((rows) => rows[0])

	if (!property || !property.listingData) {
		return null
	}

	const listing = property.listingData as Listing
	for (const room of listing.data.gallery.rooms) {
		for (const image of room.images) {
			image.orientation = image.orientation.toUpperCase() as
				| "LANDSCAPE"
				| "PORTRAIT"
		}
	}

	return {
		data: listing.data,
		pricePerNight: property.pricePerNight
	}
}

function validPhoto(s: string) {
 try { const u = new URL(s); return u.protocol === "https:" && (u.hostname === "muscache.com" || u.hostname.endsWith(".muscache.com")) }
 catch {return false}
}
function validIcal(s: string) {
 try { const u = new URL(s); return u.protocol==="https:" && ["www.airbnb.com","airbnb.com","www.airbnb.com.br","airbnb.com.br"].includes(u.hostname) && /^\/calendar\/ical\/\d+\.ics$/.test(u.pathname) }
 catch {return false}
}
export async function saveListingExtras(id:string, image:string, summary:string, ical:string) {
 const {userId}=await auth(); if(!userId) throw new Error("Acesso negado")
 if(image && !validPhoto(image)) throw new Error("Use a URL da imagem original do Airbnb (muscache.com).")
 if(ical && !validIcal(ical)) throw new Error("Use o link iCal exportado pelo Airbnb.")
 await db.update(properties).set({coverImageUrl:image||null,listingSummary:summary.slice(0,3000),icalUrl:ical||null}).where(sql`${properties.id} = ${id} AND ${properties.clerkId} = ${userId}`)
 return {success:true}
}
export async function fetchListingPhoto(id:string) {
 const {userId}=await auth();if(!userId) throw new Error("Acesso negado")
 const [p]=await db.select({url:properties.url}).from(properties).where(sql`${properties.id} = ${id} AND ${properties.clerkId} = ${userId}`).limit(1)
 if(!p)throw new Error("Imóvel não encontrado")
 const room=new URL(p.url).pathname.match(/^\/rooms\/(\d+)$/)?.[1]
 if(!room)throw new Error("Anúncio inválido")
 const response=await fetch("https://www.airbnb.com.br/rooms/"+room,{cache:"no-store",signal:AbortSignal.timeout(10000),headers:{"User-Agent":"Mozilla/5.0"}})
 if(!response.ok)throw new Error("Airbnb bloqueou a consulta pública da foto.")
 const html=await response.text()
 const match=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
 const image=match?.[1]?.replaceAll("&amp;","&")||""
 if(!validPhoto(image))throw new Error("Foto oficial não disponível neste anúncio.")
 await db.update(properties).set({coverImageUrl:image}).where(sql`${properties.id} = ${id} AND ${properties.clerkId} = ${userId}`)
 return {success:true,image}
}
export async function blockedDates(id:string) {
 const {userId}=await auth();if(!userId)throw new Error("Acesso negado")
 const [p]=await db.select({ical:properties.icalUrl}).from(properties).where(sql`${properties.id} = ${id} AND ${properties.clerkId} = ${userId}`).limit(1)
 if(!p?.ical || !validIcal(p.ical))throw new Error("Vincule primeiro o iCal do Airbnb.")
 const response=await fetch(p.ical,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)})
 if(!response.ok)throw new Error("Não foi possível consultar o calendário.")
 const data=await response.text()
 if(data.length>2000000 || !data.includes("BEGIN:VCALENDAR"))throw new Error("Calendário inválido.")
 const dates=new Set<string>()
 for(const event of data.split("BEGIN:VEVENT").slice(1)) {
 const start=event.match(/^DTSTART[^:]*:(\d{8})/m)?.[1],end=event.match(/^DTEND[^:]*:(\d{8})/m)?.[1]
 if(!start||!end)continue
 const parse=(s:string)=>Date.UTC(Number(s.slice(0,4)),Number(s.slice(4,6))-1,Number(s.slice(6,8)))
 const a=parse(start),b=parse(end)
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<a||b-a>366*86400000)continue
 for(let t=a;t<b;t+=86400000)dates.add(new Date(t).toISOString().slice(0,10))
 }
 return {blocked:Array.from(dates).sort(),checkedAt:new Date().toISOString()}
}
