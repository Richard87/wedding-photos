"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import { theme } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ChakraProvider theme={theme}>
			{children}
			<ToastContainer
				position="bottom-right"
				autoClose={false}
				newestOnTop
				closeOnClick={false}
				rtl={false}
				pauseOnFocusLoss={false}
				draggable={false}
				theme="light"
			/>
		</ChakraProvider>
	);
}
