"use client"

import {
	Button,
	Center,
	FormControl,
	FormHelperText,
	FormLabel,
	Input,
	Text,
} from "@chakra-ui/react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { type FormEvent, useState } from "react"

const validRegex = /[\W_]/g

export function Login() {
	const searchParams = useSearchParams()
	const [username, setUsername] = useState<string>("")
	const [pin, setPin] = useState<string>("")

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		const cleaned = username.toLowerCase().trim().replace(validRegex, "-")
		await signIn("credentials", {
			username: cleaned,
			pin,
			callbackUrl: `/gallery/${cleaned}`,
		})
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<FormControl>
				<FormLabel>Your Name</FormLabel>
				<Input
					width={"100%"}
					type="text"
					id="username"
					name="username"
					autoComplete="off"
					required
					value={username}
					minLength={4}
					pattern="[a-zA-Z0-9-]*"
					onChange={(e) => setUsername(e.target.value)}
				/>
				<FormHelperText>
					Please use the english alphabet, without spaces, min 4 letters
				</FormHelperText>
			</FormControl>
			<FormControl style={{ marginTop: "30px" }}>
				<FormLabel>Pin (optional)</FormLabel>
				<Input
					width={"100%"}
					type="text"
					id="pin"
					name="pin"
					autoComplete="off"
					value={pin}
					onChange={(e) => setPin(e.target.value)}
				/>
				<FormHelperText>You can add a PIN to secure your images</FormHelperText>
			</FormControl>
			<Center>
				<Button variant={"primary"} type="submit">
					Sign in
				</Button>
			</Center>

			<Center>
				{searchParams.get("error") && (
					<Text color={"red.600"} casing={"capitalize"}>
						Login failed. Please try again
					</Text>
				)}
			</Center>
		</form>
	)
}
