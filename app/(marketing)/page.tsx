import { Navbar } from "@/app/_components/Navbar"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { Code2, MessageSquare, Search, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function MarketingPage() {
	const { userId } = await auth()

	return (
		<div>
			<Navbar />

			<main>
				{/* Hero Section */}
				<section className="container mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<div className="flex items-center gap-2 mb-6">
								<span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
									Código aberto
								</span>
								<span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
									Hospedagem própria
								</span>
							</div>
							<h1 className="text-5xl font-bold tracking-tight">
								Seus anúncios.
								<br />
								<span className="text-primary">Seus relacionamentos.</span>
							</h1>
							<p className="mt-6 text-xl text-gray-600">
								Importe seus anúncios do Airbnb para o Cadena - Airbnb. Fale diretamente com
								os hóspedes, evite taxas e tenha controle sobre sua operação — tudo
								sem perder o controle dos seus dados.
							</p>
							<div className="mt-8 flex gap-4">
								<Link href="/dashboard">
									<Button size="lg">
										{userId ? "Acessar painel" : "Começar agora"}
									</Button>
								</Link>
								<Link href="/explore">
									<Button size="lg" variant="outline">
										<Search className="mr-2 h-5 w-5" />
										Explorar anúncios
									</Button>
								</Link>
							</div>
						</div>
						<div className="rounded-xl border bg-background shadow-lg">
							<div className="flex items-center border-b px-4 py-2">
								<div className="flex gap-2">
									<div className="h-3 w-3 rounded-full bg-red-500" />
									<div className="h-3 w-3 rounded-full bg-yellow-500" />
									<div className="h-3 w-3 rounded-full bg-green-500" />
								</div>
							</div>
							<AspectRatio ratio={16 / 9} className="overflow-hidden">
								<Image
									src="/screenshot.png"
									alt="Página de exemplo de anúncio"
									fill
									className="object-cover scale-[1.15] origin-center"
									priority
								/>
							</AspectRatio>
						</div>
					</div>
				</section>

				{/* Stats Section */}
				<section className="border-y bg-muted/30">
					<div className="container mx-auto px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
							<div>
								<div className="text-4xl font-bold text-primary">100%</div>
								<div className="mt-2 text-sm text-gray-600">
									Reservas sem taxas
								</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-primary">1-Click</div>
								<div className="mt-2 text-sm text-gray-600">Importação do Airbnb</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-primary">∞</div>
								<div className="mt-2 text-sm text-gray-600">
									Opções de hospedagem própria
								</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-primary">0BSD</div>
								<div className="mt-2 text-sm text-gray-600">Licença</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="bg-background">
					<div className="container mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40">
						<h2 className="text-3xl font-bold text-center">
							Criado para anfitriões independentes
						</h2>
						<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
							<Card>
								<CardContent className="pt-6">
									<div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
										<MessageSquare className="h-6 w-6 text-primary" />
									</div>
									<h3 className="mt-4 text-xl font-semibold">
										Comunicação direta com hóspedes
									</h3>
									<p className="mt-2 text-gray-600">
										Converse diretamente com os hóspedes pelos seus
										canais preferidos. Construa relacionamentos duradouros sem
										restrições das plataformas.
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-6">
									<div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
										<Code2 className="h-6 w-6 text-primary" />
									</div>
									<h3 className="mt-4 text-xl font-semibold">
										Hospede e personalize
									</h3>
									<p className="mt-2 text-gray-600">
										Instale o Cadena - Airbnb na sua infraestrutura. Personalize o código
										para suas necessidades. Sua plataforma, do seu jeito.
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-6">
									<div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
										<Users className="h-6 w-6 text-primary" />
									</div>
									<h3 className="mt-4 text-xl font-semibold">
										Desenvolvimento colaborativo
									</h3>
									<p className="mt-2 text-gray-600">
										Participe de uma comunidade de anfitriões independentes. Compartilhe experiências,
										contribua com o código e ajude a melhorar a plataforma.
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="container mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40">
					<div className="bg-primary rounded-2xl text-primary-foreground p-12 text-center">
						<h2 className="text-3xl font-bold">Pronto para assumir o controle?</h2>
						<p className="mt-4 text-xl opacity-90">
							Tenha autonomia para administrar seus imóveis.
						</p>
						<div className="mt-8 flex justify-center gap-4">
							<Link href="/dashboard">
								<Button size="lg" variant="secondary">
									{userId ? "Acessar painel" : "Começar agora"}
								</Button>
							</Link>
							<Link href="/explore">
								<Button
									size="lg"
									variant="outline"
									className="bg-primary/10 hover:bg-primary/20"
								>
									Explorar anúncios
								</Button>
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	)
}
