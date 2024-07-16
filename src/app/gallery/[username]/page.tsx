"use server";

import Gallery from "@/components/Gallery";
import { getServerAuthSession } from "@/server/auth";
import { ulid } from "ulidx";

import {
	getSignedObjectFetchUrl,
	getSignedObjectUploadUrl,
	listObjects,
} from "@/server/services/storage";
import type { Image } from "@/types/image";
import type { GetSignedUploadUrlFunc } from "@/components/ImageQueue";
import { Nav } from "@/components/Nav";
import { Box, Flex } from "@chakra-ui/react";

export default async function GalleryPage({
	params,
}: { params: { username: string } }) {
	const authSession = await getServerAuthSession();
	console.log(authSession)
	const user = authSession?.user;
	if (!user || user.name !== params.username)
		throw new Error("Not authenticated!");


	const getSignedFetchUrl = async (filename: string) => {
		"use server";
		return await getSignedObjectFetchUrl(filename);
	}

	const files = await listObjects(`${user.name}_photos/`);
	const images: Image[] = [];
	for (const file of files) {
		const url = await getSignedFetchUrl(file.name as string);
		images.push({
			etag: file.etag,
			lastModified: file.lastModified?.toISOString(),
			name: file.name as string,
			size: file.size,
			src: url,
		});
	}


	const getSignedUploadUrl: GetSignedUploadUrlFunc = async (username, ratio) => {
		"use server";
		const id = ulid();
		const filename = `${username}_photos/${id}_${ratio}`;
		return [filename, await getSignedObjectUploadUrl(filename)];
	};

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
	);
}