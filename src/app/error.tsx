"use client" // Error components must be Client Components

import { useEffect } from "react"
import { Box, Heading, Button } from "@chakra-ui/react"
import { signOut } from "next-auth/react"

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

    const onClick = () => {
        reset()
        signOut({ callbackUrl: "/" })
    }

	return (
		<Box>
			<Heading>Something went wrong!</Heading>
			<Button colorScheme='teal' onClick={onClick}>Try again</Button>
		</Box>
	)
}
