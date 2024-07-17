import { Lugrasimo } from "next/font/google"

const lugrasimo = Lugrasimo({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-lugrasimo",
})

export const fonts = {
	lugrasimo,
}
