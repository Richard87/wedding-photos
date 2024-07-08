"use server";

import Gallery from "@/components/Gallery";
import { getServerAuthSession } from "@/server/auth";
import { ulid } from "ulidx";

import * as Minio from "minio";

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

export default async function HomePage() {
	const authSession = await getServerAuthSession();
	const user = authSession?.user;
	if (!user) throw new Error("Not authenticated!");

	const files = await listObjects("wedding", `${user.name}_photos/`);
	const images = [];
	for (const file of files) {
		const url = await minioClient.presignedGetObject(
			"wedding",
			file.name as string,
			500,
		);
		images.push({ ...file, url });
	}

	const getSignedUrl = async (username: string, ratio: string) => {
		"use server";
		const id = ulid();
		const filename = `${username}_photos/${id}_${ratio}`;
		return await minioClient.presignedPutObject("wedding", filename, 5_000);
	};

	return (
		<main className="flex items-center justify-center h-screen">
			<Gallery
				user={authSession.user}
				getSignedUrl={getSignedUrl}
				images={images}
			/>
		</main>
	);
}
