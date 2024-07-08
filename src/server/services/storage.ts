"use server"
import * as Minio from "minio";

const minioClient = new Minio.Client({
	endPoint: "127.0.0.1",
	port: 9000,
	useSSL: false,
	accessKey: process.env.S3_ACCESS_KEY as string,
	secretKey: process.env.S3_SECRET_KEY as string,
});

export function listObjects(path: string): Promise<Minio.BucketItem[]> {
	return new Promise((resolve, reject) => {
		const images: Minio.BucketItem[] = [];
		const imagesStream = minioClient.listObjects("wedding", path);
		imagesStream.on("data", (image) => images.push(image));
		imagesStream.on("error", (err) => reject(err));
		imagesStream.on("end", () => resolve(images));
	});
}
export async function getSignedObjectFetchUrl(path: string, ttl = 500) {
    return await minioClient.presignedGetObject(
        process.env.S3_BUCKET as string,
        path,
        ttl,
    );
}
export async function getSignedObjectUploadUrl(path: string, ttl = 500) {
    return await minioClient.presignedPutObject(
        process.env.S3_BUCKET as string,
        path,
        ttl,
    );
}