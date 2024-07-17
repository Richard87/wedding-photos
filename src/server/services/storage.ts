"use server"

import {
	PutObjectCommand,
	GetObjectCommand,
	ListObjectsCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const S3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT as string,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY as string,
		secretAccessKey: process.env.S3_SECRET_KEY as string,
	},
	region: "auto",
})

export type S3File = {
	etag?: string
	name?: string
	size?: number
}

export async function listObjects(path: string): Promise<S3File[]> {
	const cmd = new ListObjectsCommand({
		Bucket: process.env.S3_BUCKET as string,
		Delimiter: "/",
		Prefix: path,
	})

	const response = await S3.send(cmd)
	return (
		response.Contents?.map((f) => ({
			etag: f.ETag,
			name: f.Key,
			size: f.Size,
		})) ?? []
	)
}

export async function getSignedObjectFetchUrl(path: string) {
	return await getSignedUrl(
		S3,
		new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: path }),
		{
			expiresIn: 3600, // 1 Hour
		},
	)
}
export async function getSignedObjectUploadUrl(path: string) {
	return await getSignedUrl(
		S3,
		new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: path }),
		{
			expiresIn: 3600, // 1 Hour
		},
	)
}
