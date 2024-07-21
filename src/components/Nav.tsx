"use client"

import { Box, Center, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { signOut } from "next-auth/react"

export function Nav(props: { username: string }) {
	return (
		<Box>
			<Container>
				<Flex padding={3} alignItems={"center"}>
					<Center>
						<Heading>K ♡ R </Heading>
					</Center>
					<Center flex={1}>
						<Text hideBelow={"sm"}>
							Welcome to our wedding {props.username}
						</Text>
					</Center>
					<Center>
						<button type="button" onClick={() => signOut({ callbackUrl: "/" })}>
							Sign out
						</button>
					</Center>
				</Flex>
			</Container>
		</Box>
	)
}
