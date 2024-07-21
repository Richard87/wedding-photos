import { Login } from "@/components/Login"
import { getServerAuthSession } from "@/server/auth"
import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { redirect } from "next/navigation"
import React from "react"

export default async function LoginPage() {
	const authSession = await getServerAuthSession()

	if (authSession?.user?.name != null) {
		return redirect(`/gallery/${authSession.user.name}`)
	}

	return (
		<Container
			display={"flex"}
			alignItems={"center"}
			justifyContent={"space-around"}
			flexDirection={"column"}
			height={"100%"}
		>
			<Flex flex={0.5} justifyContent={"center"} direction={"column"}>
				<Heading size={"md"}>
					Welcome to Kristiya & Richards Wedding Gallery
				</Heading>
				<Text>
					Please upload any images or videos you want to share with us
				</Text>
				<Text>กรุณาเพิ่มรูปภาพหรือวิดีโอที่คุณต้องการแบ่งปันให้กับเรา</Text>
			</Flex>

			<Login />
		</Container>
	)
}
