"use client";
import type { Image } from "@/types/image";
import type { User } from "@/types/user";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

type Props = {
	username: string;
	images: Image[];
	getSignedUrl: (username: string, ratio: string) => Promise<string>;
	revalidate: () => unknown;
};

export default function Gallery({
	username,
	images,
	getSignedUrl,
	revalidate,
}: Props) {
	const [openIndex, setOpenIndex] = React.useState<number>();
	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			for (const image of acceptedFiles) {
				const { width, height } = await getImageDimensions(image);
				const ratio = (width / height).toFixed(5);
				const url = await getSignedUrl(username as string, ratio);

				console.log(url);
				await fetch(url, { body: image, method: "PUT" });
				console.log("uploaded ", image.name);
			}

			revalidate();
		},
		[username, getSignedUrl, revalidate],
	);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
			<div {...getRootProps()}>
				<h1>{username}</h1>
				<input {...getInputProps()} />
				{isDragActive ? (
					<p>Drop the files here ...</p>
				) : (
					<p>Drag 'n' drop some files here, or click to select files</p>
				)}
			</div>
			{images.map((image, index) => (
				<div key={image.name}>
					<img
						onPointerDown={() => setOpenIndex(index)}
						className="h-40 w-full max-w-full rounded-lg object-cover object-center"
						src={image.src}
						alt="gallery-photo"
					/>
				</div>
			))}
			<Lightbox
				open={openIndex !== undefined}
				index={openIndex}
				close={() => setOpenIndex(undefined)}
				slides={images}
			/>
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
	};
}
