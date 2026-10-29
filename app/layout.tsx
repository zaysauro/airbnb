import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: {
		default: "Cadena - Airbnb - Property Management Platform",
		template: "%s | Cadena - Airbnb"
	},
	description:
		"Importe seus anúncios do Airbnb para o Cadena - Airbnb. Fale diretamente com os hóspedes, evite taxas e tenha controle sobre sua operação — tudo sem perder o controle dos seus dados.",
	keywords: [
		"property management",
		"vacation rentals",
		"airbnb import",
		"direct bookings",
		"rental management",
		"host platform"
	],
	authors: [
		{
			name: "Cadena - Airbnb"
		}
	],
	creator: "Cadena - Airbnb",
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: "https://cadena-airbnb.vercel.app",
		title: "Cadena - Airbnb - Property Management Platform",
		description:
			"Importe seus anúncios do Airbnb para o Cadena - Airbnb. Fale diretamente com guests, avoid fees, and take control of your rental business.",
		siteName: "Cadena - Airbnb",
		images: [
			{
				url: "/opengraph.jpg",
				width: 1200,
				height: 630,
				alt: "Cadena - Airbnb - Property Management Platform"
			}
		]
	},
	
	robots: {
		index: true,
		follow: true
	},
	twitter: {
		card: "summary_large_image",
		title: "Cadena - Airbnb - Property Management Platform",
		description:
			"Importe seus anúncios do Airbnb para o Cadena - Airbnb. Fale diretamente com guests, avoid fees, and take control of your rental business.",
		images: ["/opengraph.jpg"]
	},
	icons: [
		{
			rel: "icon",
			type: "image/jpeg",
			url: "/favicon.jpg"
		}
	]
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<>
			<html lang="pt-BR">
				<head>
					<link rel="stylesheet" href="https://use.typekit.net/gnn8txw.css" />
				</head>
				<body>
					{children}
					<Toaster />
				</body>
			</html>
		</>
	)
}
