"use server";

import Gallery from "@/components/Gallery";
import { getServerAuthSession } from "@/server/auth";
import { ulid } from "ulidx";
import * as Minio from "minio";
import { revalidatePath } from "next/cache";

import type { Image } from "@/types/image";
import { NavbarDefault } from "@/components/Navbar";

const minioClient = new Minio.Client({
	endPoint: "127.0.0.1",
	port: 9000,
	useSSL: false,
	accessKey: process.env.S3_ACCESS_KEY as string,
	secretKey: process.env.S3_SECRET_KEY as string,
});

function listObjects(
	bucket: string,
	path: string,
): Promise<Minio.BucketItem[]> {
	return new Promise((resolve, reject) => {
		const images: Minio.BucketItem[] = [];
		const imagesStream = minioClient.listObjects("wedding", path);
		imagesStream.on("data", (image) => images.push(image));
		imagesStream.on("error", (err) => reject(err));
		imagesStream.on("end", () => resolve(images));
	});
}

export default async function GalleryPage({ params }: { params: { username: string } }) {
	const authSession = await getServerAuthSession();
	const user = authSession?.user;
	if (!user || user.name !== params.username) throw new Error("Not authenticated!");

	const files = await listObjects("wedding", `${user.name}_photos/`);
	const images: Image[] = [];
	for (const file of files) {
		const url = await minioClient.presignedGetObject(
			"wedding",
			file.name as string,
			500,
		);
		images.push({
			etag: file.etag,
			lastModified: file.lastModified?.toISOString(),
			name: file.name as string,
			size: file.size,
			src: url,
		});
	}

	const getSignedUrl = async (username: string, ratio: string) => {
		"use server";
		const id = ulid();
		const filename = `${username}_photos/${id}_${ratio}`;
		return await minioClient.presignedPutObject("wedding", filename, 5_000);
	};

	const revalidate = () => {
		"use server";
		revalidatePath(`/gallery/${user.name}`);
	};

	return (
		<main className="flex items-center justify-center h-screen">
			<Gallery
				username={authSession.user.name as string}
				getSignedUrl={getSignedUrl}
				revalidate={revalidate}
				images={images}
			/>
		</main>
	);
}
