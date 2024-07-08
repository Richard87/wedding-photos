"use client";
import type { User } from "@/types/user";
import type { Image } from "@/types/image";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as Minio from "minio";
import {revalidatePath} from "next/cache"

type Props = {
	user: User;
	images: Image[];
	getSignedUrl: (username: string, ratio: string) => Promise<string>;
};

export default function Gallery({ user, images, getSignedUrl }: Props) {

    console.log({images})

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
            for (const image of acceptedFiles) {
                const {width, height} = await getImageDimensions(image)
                const ratio = (width / height).toFixed(5)
                const url = await getSignedUrl(user.name as string, ratio);
                await fetch(url, {body: image, method: "PUT"})
            }

            revalidatePath("/gallery")
		},
		[user.name, getSignedUrl],
	);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div {...getRootProps()}>
			{isDragActive ? (
				<p>Drop the files here ...</p>
			) : (
				<p>Drag 'n' drop some files here, or click to select files</p>
			)}

			<input {...getInputProps()} />
			<h1>{user.name}</h1>
            {images.map(i => <img key={i.name} src={i.url} alt="opplastet bilde"  />)}
		</div>
	);
}


async function getImageDimensions(file: File) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const width = img.width;
    const height = img.height;
    return {
        width,
        height,
    }
  }