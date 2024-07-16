"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { type Id, toast } from "react-toastify";
import { useInterval } from "./useInterval";

export type GetSignedUploadUrlFunc = (
	username: string,
	ratio: string,
) => Promise<[string, string]>;
export type GetSignedFetchUrlFunc = (filename: string) => Promise<string>;

const initState: ImageReducerState = {
	queuedImages: [],
	completedImages: 0,
	status: "idle",
};
type ImageReducerState = {
	queuedImages: File[];
	inProgressImage?: File | null;
	completedImages: number;
	status: "idle" | "uploading" | "completed" | "working";
};

enum ActionTypes {
	ADD_IMAGE = "ADD_IMAGE",
	UPLOAD_IMAGE = "UPLOAD_IMAGE",
	IMAGE_COMPLETED = "IMAGE_COMPLETED",
	RESET_COMPLETED_IMAGES = "RESET_COMPLETED_IMAGES",
}
type Action = {
	type: ActionTypes;
	image: File | null;
};

export function useImageQueue(
	username: string,
	getSignedUploadUrl: GetSignedUploadUrlFunc,
	getSignedFetchUrl: GetSignedFetchUrlFunc,
	onUploadedImage: (filename: string, url: string) => unknown,
): { addImage: (image: File) => void } {
	const toastId = useRef<Id | null>(null);
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
				};
			case ActionTypes.UPLOAD_IMAGE:
				return {
					...state,
					queuedImages: state.queuedImages.filter((i) => i !== action.image),
					inProgressImage: action.image,
					status: "uploading",
				};
			case ActionTypes.IMAGE_COMPLETED:
				// if (state.queuedImages.length === 0) revalidateGallery(username);

				return {
					...state,
					completedImages: state.completedImages++,
					inProgressImage: null,
					status: state.queuedImages.length === 0 ? "completed" : "working",
				};
			case ActionTypes.RESET_COMPLETED_IMAGES:
				return {
					...state,
					completedImages: 0,
					status: status === "completed" ? "idle" : state.status,
				};
			default:
				return state;
		}
	};

	useInterval(async () => {
		if (!state.inProgressImage && state.queuedImages.length > 0) {
			try {
				const image = state.queuedImages[0];
				uploadingImage(image);
				const [filename, uploadUrl] = await getSignedUploadUrl(username, "X");
				try {
					await fetch(uploadUrl, { body: image, method: "PUT" });
				} catch (error) {
					console.error(error);
					toast.error("Upload failed, adding image back to queue...");
					addImage(image);
				}
				const fetchUrl = await getSignedFetchUrl(filename);

				completedImage(image);
				onUploadedImage(filename, fetchUrl);
			} catch (error) {
				console.error(error);
				toast.error("System failure, please try again");
			}
		}
	}, 100);

	const [state, dispatch] = useReducer(reducer, initState);

	const command = useCallback(
		(action: ActionTypes, payload: File | null): Action => ({
			type: action,
			image: payload,
		}),
		[],
	);
	const addImage = useCallback(
		(image: File) => {
			if (toastId.current == null)
				toastId.current = toast("Uploading images...");
			dispatch(command(ActionTypes.ADD_IMAGE, image));
		},
		[command],
	);
	const completedImage = (image: File) =>
		dispatch(command(ActionTypes.IMAGE_COMPLETED, image));
	const uploadingImage = (image: File) =>
		dispatch(command(ActionTypes.UPLOAD_IMAGE, image));
	const resetCompletedImages = useCallback(
		() => dispatch(command(ActionTypes.RESET_COMPLETED_IMAGES, null)),
		[command],
	);

	const status = state.status;
	const queuedImagesCount = state.queuedImages.length;
	const completedImages = state.completedImages;
	const inProgressImage = state.inProgressImage;

	useEffect(() => {
		if (status === "completed" && toastId.current != null) {
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
		if (status === "uploading" && toastId.current != null)
			toast.update(toastId.current, {
				render: `uploading ${inProgressImage?.name ?? "image"}`,
				closeButton: false,
				progress:
					(completedImages + 1) / (completedImages + queuedImagesCount + 1),
			});
		if (status === "working" && toastId.current != null)
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
		status,
		resetCompletedImages,
	]);

	return { addImage };
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
