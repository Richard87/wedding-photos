"use server"

import Gallery from "@/components/Gallery"
import { getServerAuthSession } from "@/server/auth"
import { ulid } from "ulidx"
import {createHash} from "node:crypto"

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
import type { User } from "@/types/user"

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

	const prefix = await getPrefix(user)
	const files = await listObjects(`${prefix}/`)
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
		ratio,
	) => {
		"use server"
		let extension = mime.extension(type)
		const id = ulid()

		if (extension === "heic" || extension === "heif") {
			extension = "jpeg"
		}

		const prefix = await getPrefix(user)

		const filenames: Record<FileSizes, string> = {
			blur: `${prefix}/${id}.${ratio}.blur.jpeg`,
			original: `${prefix}/${id}.${ratio}.original.${extension}`,
			small: `${prefix}/${id}.${ratio}.small.jpeg`,
			heic: `${prefix}/${id}.${ratio}.heic.heic`,
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

const getPrefix = async (user: User) => {
	const hash = await getSHA256Hash(`${user.name}_photos_${user.id ?? "0000"}`)
	const prefix = `${user.name}_photos_${hash.substring(0, 10)}`
	return prefix
}

const getSHA256Hash = async (input: string) => {
	const sha256hash = createHash('sha256');
	return sha256hash.update(input).digest("hex")


	// const textAsBuffer = new TextEncoder().encode(input);
	// const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
	// const hashArray = Array.from(new Uint8Array(hashBuffer));
	// const hash = hashArray
	//   .map((item) => item.toString(16).padStart(2, "0"))
	//   .join("");
	// return hash;
  };