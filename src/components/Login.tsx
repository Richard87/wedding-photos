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

export function Login() {
	const searchParams = useSearchParams()
	const [username, setUsername] = useState<string>("")

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault()
		await signIn("credentials", {
			username: username.toLowerCase(),
			callbackUrl: `/gallery/${username.toLowerCase()}`,
		})
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<FormControl>
				<Center>
					<FormLabel>Your Name</FormLabel>
				</Center>
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
