import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import "react-toastify/dist/ReactToastify.css"
import { fonts } from "@/components/fonts"

export const metadata: Metadata = {
	title: "K ♡ R = Wedding",
	description: "Kristiya ♡ Richard = Wedding",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={fonts.lugrasimo.variable}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
