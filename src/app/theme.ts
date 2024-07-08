import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
	styles: {
		global: {
			// styles for the `body`
			body: {
				bg: "linear-gradient(142deg, rgba(82,245,173,1) 0%, rgba(55,213,149,1) 12%, rgba(255,251,248,1) 100%)",
				color: "rgb(2, 34, 9)",
			},
		},
	},
	fonts: {
		heading: "var(--font-rubik)",
		body: "var(--font-rubik)",
	},
});
