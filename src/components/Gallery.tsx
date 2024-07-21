"use client"
import type { Image as ImageType } from "@/types/image"
import {
	Box,
	Center,
	Container,
	Grid,
	GridItem,
	Text,
	Image,
	Button,
} from "@chakra-ui/react"
import React, { useCallback, useState } from "react"
import { type DropzoneOptions, useDropzone } from "react-dropzone"
import {
	type GetSignedFetchUrlFunc,
	type GetSignedUploadUrlFunc,
	useImageQueue,
} from "./ImageQueue"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

type Props = {
	username: string
	images: ImageType[]
	getSignedUploadUrl: GetSignedUploadUrlFunc
	getSignedFetchUrl: GetSignedFetchUrlFunc
}

type FileSizeType = Parameters<GetSignedUploadUrlFunc>[1]
type ParsedImageDescription = {
	src: string
	ratio: string
	id: string
	size: string
	ext: string
}
type ParsedImages = Record<
	string,
	{ [k in FileSizeType]: ParsedImageDescription }
>

export default function Gallery({
	username,
	images,
	getSignedUploadUrl,
	getSignedFetchUrl,
}: Props) {
	const [localImages, setLocalImages] = useState(images)
	const { addImage } = useImageQueue(
		username,
		getSignedUploadUrl,
		getSignedFetchUrl,
		(filename, url) =>
			setLocalImages((imgs) => [
				...imgs,
				{ name: filename, src: url, size: 0 },
			]),
	)
	const onDrop = useCallback(
		(acceptedFiles: File[]) => acceptedFiles.forEach(addImage),
		[addImage],
	)
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		noClick: true,
	})
	const [showIndex, setShowIndex] = useState<number | null>(null)

	const parsedImages = localImages.reduce<ParsedImages>(
		(curry, item, index) => {
			const parts = item.name.split(".", -2)
			const ext = parts.pop()
			const size: FileSizeType = parts.pop() as FileSizeType
			const id = parts.shift()
			const ratio = parts.join(".")

			if (!ext || !size || !id || !ratio) {
				return curry
			}

			const desc: ParsedImageDescription = {
				src: item.src,
				ratio,
				size,
				id,
				ext,
			}

			if (curry[id] == null) curry[id] = { [size]: desc }
			curry[id][size] = desc

			return curry
		},
		{},
	)

	const slides = Object.entries(parsedImages).map(([, item]) => ({
		src: item?.original.src ?? "",
	}))

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
					<Grid templateColumns="repeat(auto-fill, minmax(160px, 1fr))" gap={6}>
						{Object.entries(parsedImages).map(([id, item], index) => (
							<GridItem key={id}>
								<Image
									_hover={{ cursor: "pointer" }}
									width={"100%"}
									height={"100%"}
									fallbackSrc={item.blur?.src}
									onClick={() => setShowIndex(index)}
									objectFit={"cover"}
									borderRadius={5}
									src={item.small?.src ?? item.original?.src ?? ""}
									alt="gallery-photo"
								/>
							</GridItem>
						))}
					</Grid>
				</Box>
			</Container>
			<Lightbox
				open={showIndex != null}
				index={showIndex ?? 0}
				close={() => setShowIndex(null)}
				slides={slides}
			/>
		</Box>
	)
}

const InnerDropzone = (props: {
	onDrop: DropzoneOptions["onDrop"]
	isDragActive: boolean
}) => {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: props.onDrop,
	})

	return (
		<Box {...getRootProps()}>
			<input {...getInputProps()} />
			<Center>
				<Text
					visibility={isDragActive || props.isDragActive ? "visible" : "hidden"}
				>
					Drop the files here ...
				</Text>
			</Center>

			<Center>
				<Text>Please upload all images you want to share with us ♡</Text>
			</Center>

			<Center mt={3} onClick={() => void 0}>
				<Button colorScheme='teal'>Select files</Button>
			</Center>
		</Box>
	)
}
