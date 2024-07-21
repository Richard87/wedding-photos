"use client"

import {
	Button,
	Flex,
	Center,
	FormControl,
	FormHelperText,
	FormLabel,
	Input,
	Text,
	Box,
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
		<Flex
			flex={1}
			direction={"column"}
			onSubmit={handleSubmit}
			as={"form"}
			gap={9}
		>
			<FormControl>
				<FormLabel>Your Name / ชื่อคุณ</FormLabel>
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
					Please use the english alphabet, without spaces, minimum 4 letters
				</FormHelperText>
				<FormHelperText>
					กรุณาใช้ตัวอักษรภาษาอังกฤษ โดยไม่ต้องเว้นวรรค ขั้นต่ำ 4 ตัวอักษร
				</FormHelperText>
			</FormControl>
			<FormControl>
				<FormLabel>Pin / รหัสผ่าน (optional / ทางเลือก)</FormLabel>
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
				<FormHelperText>
					คุณสามารถเพิ่ม รหัสผ่าน เพื่อรักษาความปลอดภัยให้กับภาพของคุณได้
				</FormHelperText>
			</FormControl>
			<Box>
				<Button colorScheme="teal" type="submit">
					Sign in / เข้าสู่ระบบ
				</Button>
			</Box>

			<Box>
				{searchParams.get("error") && (
					<Text color={"red.600"} casing={"capitalize"}>
						Login failed. Please try again
					</Text>
				)}
			</Box>
		</Flex>
	)
}
