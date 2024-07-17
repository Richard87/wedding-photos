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
			etag: file.etag,
			lastModified: file.lastModified?.toISOString(),
			name: file.name as string,
			size: file.size,
			src: url,
		})
	}

	const getSignedUploadUrl: GetSignedUploadUrlFunc = async (
		type,
		username,
		ratio,
	) => {
		"use server"
		const extension = mime.extension(type)
		const id = ulid()

		const filenames: Record<FileSizes, string> = {
			blur: `${username}_photos/${id}.${ratio}.blur.${extension}`,
			original: `${username}_photos/${id}.${ratio}.original.${extension}`,
			small: `${username}_photos/${id}.${ratio}.small.${extension}`,
		}
		const urls: Record<FileSizes, string> = {
			blur: await getSignedObjectUploadUrl(filenames.blur),
			original: await getSignedObjectUploadUrl(filenames.original),
			small: await getSignedObjectUploadUrl(filenames.small),
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
