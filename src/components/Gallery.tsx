"use client";
import type { Image } from "@/types/image";
import React, {
	act,
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import { useDropzone } from "react-dropzone";
import { Box, Center, Container, Grid, GridItem, Text } from "@chakra-ui/react";
import { revalidateGallery } from "@/server/actions";
import {
	useImageQueue,
	type GetSignedUploadUrlFunc,
	type GetSignedFetchUrlFunc,
} from "./ImageQueue";
import { type Id, toast } from "react-toastify";
import { progress } from "framer-motion";

type Props = {
	username: string;
	images: Image[];
	getSignedUploadUrl: GetSignedUploadUrlFunc;
	getSignedFetchUrl: GetSignedFetchUrlFunc;
};
// TODO: Test revalidate image upload while in progress

export default function Gallery({
	username,
	images,
	getSignedUploadUrl,
	getSignedFetchUrl,
}: Props) {
	const [localImages, setLocalImages] = useState(images);
	const [
		{ state, inProgressImage, completedImages, queuedImages },
		{ addImage, resetCompletedImages },
	] = useImageQueue(
		username,
		getSignedUploadUrl,
		getSignedFetchUrl,
		(filename, url) =>
			setLocalImages((imgs) => [
				...imgs,
				{ name: filename, src: url, size: 0 },
			]),
	);
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

	return (<Box {...getRootProps()} minHeight={"100%"} borderStyle={"dashed"} borderColor={isDragActive ? "green.500" : "white"} boxSizing="content-box" borderWidth={5}>
		<Container>
			<Box mb={9} pt={3}>
				<input {...getInputProps()} />
				<Center><Text visibility={isDragActive ? "visible" : "hidden"}>Drop the files here ...</Text></Center>

				<Center><Text>Please <strong>click here</strong> to upload any images you want to share with us ♡</Text></Center>
			</Box>
			<Box mb={3}>
				<Grid templateColumns="repeat(4, 1fr)" gap={6}>
					{localImages.map((image) => (
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
			</Box>
		</Container></Box>
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
