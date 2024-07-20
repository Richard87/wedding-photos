"use server"

import Gallery from "@/components/Gallery"
import { getServerAuthSession } from "@/server/auth"
import { ulid } from "ulidx"

import type { FileSizes, GetSignedUploadUrlFunc } from "@/components/ImageQueue"
import { Nav } from "@/components/Nav"
import {
	getSignedObjectFetchUrl,
	getSignedObjectUploadUrl,
	listObjects,
} from "@/server/services/storage"
import type { Image } from "@/types/image"
import { Box, Flex } from "@chakra-ui/react"
import mime from "mime-types"

export default async function GalleryPage({
	params,
}: { params: { username: string } }) {
	const authSession = await getServerAuthSession()
	console.log(authSession)
	const user = authSession?.user
	if (!user || user.name !== params.username)
		throw new Error("Not authenticated!")

	const getSignedFetchUrl = async (filename: string) => {
		"use server"
		return await getSignedObjectFetchUrl(filename)
	}

	const files = await listObjects(`${user.name}_photos/`)
	const images: Image[] = []
	for (const file of files) {
		const url = await getSignedFetchUrl(file.name as string)
		images.push({
			name: file.name as string,
			size: file.size ?? 0,
			src: url,
		})
	}

	const getSignedUploadUrl: GetSignedUploadUrlFunc = async (
		type,
		username,
		ratio,
	) => {
		"use server"
		let extension = mime.extension(type)
		const id = ulid()

		if (extension === "heic" || extension === "heif") {
			extension = "jpeg"
		}

		const filenames: Record<FileSizes, string> = {
			blur: `${username}_photos/${id}.${ratio}.blur.jpeg`,
			original: `${username}_photos/${id}.${ratio}.original.${extension}`,
			small: `${username}_photos/${id}.${ratio}.small.jpeg`,
			heic: `${username}_photos/${id}.${ratio}.heic.heic`,
		}
		const urls: Record<FileSizes, string> = {
			blur: await getSignedObjectUploadUrl(filenames.blur),
			original: await getSignedObjectUploadUrl(filenames.original),
			small: await getSignedObjectUploadUrl(filenames.small),
			heic: await getSignedObjectUploadUrl(filenames.heic),
		}

		return [filenames, urls]
	}

	return (
		<Flex direction={"column"} height={"100%"}>
			<Nav username={authSession.user.name as string} />
			<Box flex={1}>
				<Gallery
					username={authSession.user.name as string}
					getSignedUploadUrl={getSignedUploadUrl}
					getSignedFetchUrl={getSignedFetchUrl}
					images={images}
				/>
			</Box>
		</Flex>
	)
}
