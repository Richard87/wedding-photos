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
import { type DropzoneOptions, useDropzone } from "react-dropzone";
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
	const { addImage } = useImageQueue(
		username,
		getSignedUploadUrl,
		getSignedFetchUrl,
		(filename, url) =>
			setLocalImages((imgs) => [
				...imgs,
				{ name: filename, src: url, size: 0 },
			]),
	);
	const onDrop = useCallback(
		(acceptedFiles: File[]) => acceptedFiles.forEach(addImage),
		[addImage],
	);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		noClick: true,
	});

	return (
		<Box
			{...getRootProps()}
			minHeight={"100%"}
			borderStyle={"dashed"}
			borderColor={isDragActive ? "green.500" : "white"}
			boxSizing="content-box"
			borderWidth={5}
		>
			<Container>
				<Box mb={9} pt={3}>
					<input {...getInputProps()} />
					<InnerDropzone isDragActive={isDragActive} onDrop={onDrop} />
				</Box>
				<Box mb={3}>
					<Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
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
			</Container>
		</Box>
	);
}

const InnerDropzone = (props: {
	onDrop: DropzoneOptions["onDrop"];
	isDragActive: boolean;
}) => {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: props.onDrop,
		noClick: false,
	});

	return (
		<Box
			_hover={{ textDecoration: "underline", cursor: "pointer" }}
			{...getRootProps()}
		>
			<input {...getInputProps()} />
			<Center>
				<Text
					visibility={isDragActive || props.isDragActive ? "visible" : "hidden"}
				>
					Drop the files here ...
				</Text>
			</Center>

			<Center>
				<Text>
					Please <strong>click here</strong> to upload any images you want to
					share with us ♡
				</Text>
			</Center>
		</Box>
	);
};
