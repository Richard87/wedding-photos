"use client";
import type { Image } from "@/types/image";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Grid, GridItem } from '@chakra-ui/react'
import { revalidatePath } from "next/cache";
import { revalidateGallery } from "@/server/actions";

type Props = {
	username: string;
	images: Image[];
	getSignedUrl: (username: string, ratio: string) => Promise<string>;
};

export default function Gallery({
	username,
	images,
	getSignedUrl,
}: Props) {
	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			for (const image of acceptedFiles) {
                console.log("parsing image")
				const { width, height } = await getImageDimensions(image);
				const ratio = (width / height).toFixed(5);
				const url = await getSignedUrl(username as string, ratio);

				console.log(url);
				await fetch(url, { body: image, method: "PUT" });
				console.log("uploaded ", image.name);
			}

            revalidateGallery(username)
		},
		[username, getSignedUrl],
	);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
        <>
        <div {...getRootProps()}>
            <h1>{username}</h1>
            <input {...getInputProps()} />
            {isDragActive ? (
                <p>Drop the files here ...</p>
            ) : (
                <p>Drag 'n' drop some files here, or click to select files</p>
            )}
        </div>
		<Grid templateColumns='repeat(4, 1fr)' gap={6}>
			<GridItem>
			</GridItem>
			{images.map((image, index) => (
				<GridItem key={image.name}>
					<img
                        style={{
                            height: "100%",
                            width: "auto",
                            objectFit: "cover"
                        }}
						src={image.src}
						alt="gallery-photo"
					/>
				</GridItem>
			))}
        </Grid>
    </>
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
	};
}
