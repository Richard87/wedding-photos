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
			justifyContent={"center"}
			flexDirection={"column"}
			height={"100%"}
		>
			<Heading size={"md"}>
				Welcome to Kistiya & Richars Wedding Gallery
			</Heading>
			<Text>
				Please upload any images or vidoes you take that you want to share
			</Text>

			<Box m={9} />
			<Login />
		</Container>
	)
}
