"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"
import { useInterval } from "./useInterval"
import { useLeavePageConfirm } from "./useLeavePageConfirm"
import { type ToastId, useToast } from "@chakra-ui/react"

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
	UPLOADING = "UPLOAD_IMAGE",
	COMPLETED = "IMAGE_COMPLETED",
	RESET_COMPLETED_IMAGES = "RESET_COMPLETED_IMAGES",
	FAILED = "IMAGE_FAILED",
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
	const toastId = useRef<ToastId | null>(null)
	const toast = useToast()
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
			case ActionTypes.UPLOADING:
				return {
					...state,
					queuedImages: state.queuedImages.filter((i) => i !== action.image),
					inProgressImage: action.image,
					status: "uploading",
				}
			case ActionTypes.COMPLETED:
				return {
					...state,
					completedImages: state.completedImages++,
					inProgressImage: null,
					status: state.queuedImages.length === 0 ? "completed" : "working",
				}
			case ActionTypes.FAILED:
				return {
					...state,
					inProgressImage: null,
					status: state.queuedImages.length === 0 ? "idle" : "working",
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

	const processImage = async (image: File) => {
		try {
			let ratio = "X"
			let small: Blob | null = null
			let blur: Blob | null = null
			uploading(image)

			if (isImage(image.type)) {
				try {
					const [fsmall, fratio] = await resizeImage(image)
					ratio = fratio.toFixed(3)
					small = fsmall

					const [fblur] = await resizeImage(fsmall, 5)
					blur = fblur
				} catch (error) {
					console.error(error)
				}
			}

			const [filenames, uploadUrls] = await getSignedUploadUrl(
				image.type,
				username,
				ratio,
			)

			const url = await uploadImage(
				image,
				uploadUrls.original,
				filenames.original,
				getSignedFetchUrl,
			)
			onUploadedImage(filenames.original, url)

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
		} catch (e) {
			failed(image)
			throw e
		} finally {
			completed(image)
		}
	}

	useInterval(() => {
		if (state.inProgressImage || state.queuedImages.length === 0) return

		const image = state.queuedImages[0]
		const progress = `${state.completedImages + 1} / ${state.queuedImages.length + state.completedImages}`
		toast.promise(processImage(image), {
			success: { title: `${progress}: ${image.name} uploaded 🥳`, duration: 1000 },
			error: (e) => ({
				title: `${progress}: Failed to upload ${image.name}`,
				description: `Error: ${e.message ?? e}`,
				duration: 1000
			}),
			loading: { title: `${progress}: Uploading ${image.name}...`, duration: 1000 },
		})
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
		(image: File) => dispatch(command(ActionTypes.ADD_IMAGE, image)),
		[command],
	)
	const completed = (i: File) => dispatch(command(ActionTypes.COMPLETED, i))
	const failed = (i: File) => dispatch(command(ActionTypes.FAILED, i))
	const uploading = (i: File) => dispatch(command(ActionTypes.UPLOADING, i))

	return { addImage }
}

const isImage = (type: string) => {
	return /image\/.*/.test(type)
}

const resizeImage = async (
	file: File | Blob | null,
	newWidth = 512,
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
