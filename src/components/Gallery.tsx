"use client";
import type { Image } from "@/types/image";
import React, { act, useCallback, useEffect, useReducer, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Grid, GridItem } from "@chakra-ui/react";
import { revalidateGallery } from "@/server/actions";
import { type GetSignedUrlFunc, useImageQueue } from "./ImageQueue";
import { type Id, toast } from "react-toastify";
import { progress } from "framer-motion";

type Props = {
	username: string;
	images: Image[];
	getSignedUrl: GetSignedUrlFunc;
};
// TODO: Test revalidate image upload while in progress

export default function Gallery({ username, images, getSignedUrl }: Props) {
	const [
		{ state, inProgressImage, completedImages, queuedImages },
		{ addImage, resetCompletedImages },
	] = useImageQueue(username, getSignedUrl);
	const toastId = useRef<Id | null>(null);
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			acceptedFiles.forEach(addImage);
			toastId.current = toast("Uploading images...");
		},
		[addImage],
	);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
	const queuedImagesCount = queuedImages.length;
	useEffect(() => {
		if (state === "completed" && toastId.current != null) {
			toast.update(toastId.current, {
				render: `Compleded uploading ${completedImages} images 🥳🥳`,
				autoClose: 5000,
				onClose: resetCompletedImages,
                closeButton: true,
                closeOnClick: true,
				progress: 1,
			});
			toastId.current = null;
		}
		if (state === "uploading" && toastId.current != null)
			toast.update(toastId.current, {
				render: `uploading ${inProgressImage?.name ?? "image"}`,
                closeButton: false,
				progress:
					(completedImages + 1) / (completedImages + queuedImagesCount + 1),
			});
		if (state === "working" && toastId.current != null)
			toast.update(toastId.current, {
				render: `processing ${inProgressImage?.name ?? "image"}`,
                closeButton: false,
				progress:
					(completedImages + 1) / (completedImages + queuedImagesCount + 1),
			});
	}, [
		inProgressImage,
		completedImages,
		queuedImagesCount,
		state,
		resetCompletedImages,
	]);

	return (
		<div {...getRootProps()}>
			<div>
				<h1>{username}</h1>
				<input {...getInputProps()} />
				{isDragActive ? (
					<p>Drop the files here ...</p>
				) : (
					<p>Drag 'n' drop some files here, or click to select files</p>
				)}
			</div>
			<Grid templateColumns="repeat(4, 1fr)" gap={6}>
				{images.map((image, index) => (
					<GridItem key={image.name}>
						<img
							style={{
								height: "100%",
								width: "auto",
								objectFit: "cover",
							}}
							src={image.src}
							alt="gallery-photo"
						/>
					</GridItem>
				))}
			</Grid>
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
