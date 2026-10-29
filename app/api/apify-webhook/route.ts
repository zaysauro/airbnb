import { properties, scrapingJobs } from "@/db/schema"
import { ApifyWebhookPayloadSchema, fetchAndStoreResults } from "@/lib/apify"
import { getUserEmailAddresses } from "@/lib/clerk"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { FROM_EMAIL, getPostmarkClient } from "@/lib/postmark"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"



export async function POST(request: Request) {
	logger.info("Received webhook request")

	// Verify the secret token
	const url = new URL(request.url)
	const secret = url.searchParams.get("secret")

	if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const rawPayload = await request.json()
		logger.info("Webhook payload received")

		const payload = ApifyWebhookPayloadSchema.safeParse(rawPayload)
		if (!payload.success) {
			logger.error("Invalid webhook payload", { errors: payload.error })
			return NextResponse.json(
				{ error: "Invalid webhook payload" },
				{ status: 400 }
			)
		}

		const { eventType, resource } = payload.data
		const runId = resource.id

		if (eventType !== "ACTOR.RUN.SUCCEEDED") {
			await db
				.update(scrapingJobs)
				.set({
					status: "failed",
					completedAt: new Date()
				})
				.where(eq(scrapingJobs.runId, runId))
			logger.error("Actor run unsuccessful", { eventType, runId })
			return NextResponse.json(
				{
					success: false,
					error: "Actor run unsuccessful",
					details: {
						eventType,
						runId,
						message: "Check Apify console for run details"
					}
				},
				{ status: 400 }
			)
		}

		await fetchAndStoreResults(runId)

		// Get the job and associated property
		const job = await db
			.select()
			.from(scrapingJobs)
			.where(eq(scrapingJobs.runId, runId))
			.innerJoin(properties, eq(scrapingJobs.propertyId, properties.id))
			.limit(1)
			.then(([job]) => job)

		if (!job) {
			logger.error("Job not found", { runId })
			return NextResponse.json({ error: "Job not found" }, { status: 404 })
		}

		const userEmails = await getUserEmailAddresses(job.properties.clerkId)

		const postmark = getPostmarkClient()
		if (userEmails.length > 0 && postmark) {
			await postmark.sendEmail({
				From: FROM_EMAIL,
				To: userEmails[0],
				Subject: "Seu anúncio foi processado",
				TextBody: `"${
					job.properties.listingData?.data.h1Title as string
				}" foi processado e está disponível no seu painel.

Confira seu anúncio em https://cadena-airbnb-bruno-02a0.vercel.app/listing/${job.properties.id}`
			})
			logger.info("Notification email sent", { to: userEmails[0] })
		}

		await db
			.update(scrapingJobs)
			.set({
				status: "complete",
				completedAt: new Date()
			})
			.where(eq(scrapingJobs.runId, runId))

		return NextResponse.json({
			success: true,
			details: {
				runId,
				message: "Successfully processed actor run"
			}
		})
	} catch (error) {
		logger.error("Error processing webhook", { error })
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		)
	}
}
