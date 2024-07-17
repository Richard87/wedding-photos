"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"
import { type Id, toast } from "react-toastify"
import { useInterval } from "./useInterval"
import { useLeavePageConfirm } from "./useLeavePageConfirm"

export type FileSizes = "original" | "small" | "blur"

export type GetSignedUploadUrlFunc = (
	type: string,
	username: string,
	ratio: string,
) => Promise<[Record<FileSizes, string>, Record<FileSizes, string>]>
export type GetSignedFetchUrlFunc = (filename: string) => Promise<string>

const initState: ImageReducerState = {
	queuedImages: [],
	completedImages: 0,
	status: "idle",
}
type ImageReducerState = {
	queuedImages: File[]
	inProgressImage?: File | null
	completedImages: number
	status: "idle" | "uploading" | "completed" | "working"
}

enum ActionTypes {
	ADD_IMAGE = "ADD_IMAGE",
	UPLOAD_IMAGE = "UPLOAD_IMAGE",
	IMAGE_COMPLETED = "IMAGE_COMPLETED",
	RESET_COMPLETED_IMAGES = "RESET_COMPLETED_IMAGES",
}
type Action = {
	type: ActionTypes
	image: File | null
}

export function useImageQueue(
	username: string,
	getSignedUploadUrl: GetSignedUploadUrlFunc,
	getSignedFetchUrl: GetSignedFetchUrlFunc,
	onUploadedImage: (filename: string, url: string) => unknown,
): { addImage: (image: File) => void } {
	const toastId = useRef<Id | null>(null)
	const reducer = (
		state: ImageReducerState,
		action: Action,
	): ImageReducerState => {
		switch (action.type) {
			case ActionTypes.ADD_IMAGE:
				return {
					...state,
					queuedImages: [...state.queuedImages, action.image as File],
					status: "working",
				}
			case ActionTypes.UPLOAD_IMAGE:
				return {
					...state,
					queuedImages: state.queuedImages.filter((i) => i !== action.image),
					inProgressImage: action.image,
					status: "uploading",
				}
			case ActionTypes.IMAGE_COMPLETED:
				// if (state.queuedImages.length === 0) revalidateGallery(username);

				return {
					...state,
					completedImages: state.completedImages++,
					inProgressImage: null,
					status: state.queuedImages.length === 0 ? "completed" : "working",
				}
			case ActionTypes.RESET_COMPLETED_IMAGES:
				return {
					...state,
					completedImages: 0,
					status: state.status === "completed" ? "idle" : state.status,
				}
			default:
				return state
		}
	}

	useInterval(async () => {
		if (!state.inProgressImage && state.queuedImages.length > 0) {
			try {
				let ratio = "X"
				let small: Blob | null = null
				let blur: Blob | null = null
				const image = state.queuedImages[0]
				uploadingImage(image)

				if (isImage(image.type)) {
					const [fsmall, fratio] = await resizeImage(image)
					ratio = fratio.toFixed(3)
					small = fsmall

					const [fblur] = await resizeImage(fsmall, 5)
					blur = fblur
				}

				const [filenames, uploadUrls] = await getSignedUploadUrl(
					image.type,
					username,
					ratio,
				)

				try {
					const url = await uploadImage(
						image,
						uploadUrls.original,
						filenames.original,
						getSignedFetchUrl,
					)
					onUploadedImage(filenames.original, url)
				} catch (error) {
					console.error(error)
					toast.error("Upload failed, adding image back to queue...")
					addImage(image)
				}

				if (small) {
					try {
						const url = await uploadImage(
							small,
							uploadUrls.small,
							filenames.small,
							getSignedFetchUrl,
						)
						onUploadedImage(filenames.small, url)
					} catch (e) {
						console.error(e)
					}
				}

				if (blur) {
					try {
						const url = await uploadImage(
							blur,
							uploadUrls.blur,
							filenames.blur,
							getSignedFetchUrl,
						)
						onUploadedImage(filenames.blur, url)
					} catch (e) {
						console.error(e)
					}
				}

				completedImage(image)
			} catch (error) {
				console.error(error)
				toast.error("System failure, please try again")
			}
		}
	}, 100)

	const [state, dispatch] = useReducer(reducer, initState)

	useLeavePageConfirm(state.status !== "idle")

	const command = useCallback(
		(action: ActionTypes, payload: File | null): Action => ({
			type: action,
			image: payload,
		}),
		[],
	)
	const addImage = useCallback(
		(image: File) => {
			if (toastId.current == null)
				toastId.current = toast("Uploading images...")
			dispatch(command(ActionTypes.ADD_IMAGE, image))
		},
		[command],
	)
	const completedImage = (image: File) =>
		dispatch(command(ActionTypes.IMAGE_COMPLETED, image))
	const uploadingImage = (image: File) =>
		dispatch(command(ActionTypes.UPLOAD_IMAGE, image))
	const resetCompletedImages = useCallback(
		() => dispatch(command(ActionTypes.RESET_COMPLETED_IMAGES, null)),
		[command],
	)

	const status = state.status
	const queuedImagesCount = state.queuedImages.length
	const completedImages = state.completedImages
	const inProgressImage = state.inProgressImage

	useEffect(() => {
		if (status === "completed" && toastId.current != null) {
			toast.update(toastId.current, {
				render: `Compleded uploading ${completedImages} images 🥳🥳`,
				autoClose: 5000,
				onClose: resetCompletedImages,
				closeButton: true,
				closeOnClick: true,
				progress: 1,
			})
			toastId.current = null
		}
		if (status === "uploading" && toastId.current != null)
			toast.update(toastId.current, {
				render: `uploading ${inProgressImage?.name ?? "image"}`,
				closeButton: false,
				progress:
					(completedImages + 1) / (completedImages + queuedImagesCount + 1),
			})
		if (status === "working" && toastId.current != null)
			toast.update(toastId.current, {
				render: `processing ${inProgressImage?.name ?? "image"}`,
				closeButton: false,
				progress:
					(completedImages + 1) / (completedImages + queuedImagesCount + 1),
			})
	}, [
		inProgressImage,
		completedImages,
		queuedImagesCount,
		status,
		resetCompletedImages,
	])

	return { addImage }
}

const isImage = (type: string) => {
	return /image\/.*/.test(type)
}

const resizeImage = async (
	file: File | Blob | null,
	newWidth = 256,
): Promise<[blob: Blob | null, ratio: number]> => {
	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")
	if (ctx == null || file == null) return Promise.resolve([null, 1])

	const bitmap = await createImageBitmap(file)
	const { width, height } = bitmap
	const ratio = width / height

	const scale = newWidth / width

	const x = (newWidth - width * scale) / 2
	const y = (newWidth - height * scale) / 2

	canvas.width = width * scale
	canvas.height = height * scale
	ctx.drawImage(
		bitmap,
		0,
		0,
		width,
		height,
		0,
		0,
		width * scale,
		height * scale,
	)

	return new Promise((resolve) => {
		canvas.toBlob(
			(blob) => {
				resolve([blob, ratio])
			},
			"image/webp",
			1,
		)
	})
}

const uploadImage = async (
	content: File | Blob,
	uploadUrl: string,
	filename: string,
	getSignedFetchUrl: GetSignedFetchUrlFunc,
): Promise<string> => {
	await fetch(uploadUrl, { body: content, method: "PUT" })
	const fetchUrl = await getSignedFetchUrl(filename)

	return fetchUrl
}
