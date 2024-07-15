"use client";

import { revalidateGallery } from "@/server/actions";
import { useInterval } from "@chakra-ui/react";
import { useCallback, useReducer } from "react";
import { toast } from "react-toastify";

export type GetSignedUrlFunc = (
	username: string,
	ratio: string,
) => Promise<string>;

const initState: ImageReducerState = {
	queuedImages: [],
	completedImages: 0,
	state: "idle",
};
type ImageReducerState = {
	queuedImages: File[];
	inProgressImage?: File | null;
	completedImages: number;
	state: "idle" | "uploading" | "completed" | "working";
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
	getSignedUrl: GetSignedUrlFunc,
): [
	ImageReducerState,
	{ addImage: (image: File) => void; resetCompletedImages: () => void },
] {
	const reducer = (
		state: ImageReducerState,
		action: Action,
	): ImageReducerState => {
		switch (action.type) {
			case ActionTypes.ADD_IMAGE:
				return {
					...state,
					queuedImages: [...state.queuedImages, action.image as File],
					state: "working",
				};
			case ActionTypes.UPLOAD_IMAGE:
				return {
					...state,
					queuedImages: state.queuedImages.filter((i) => i !== action.image),
					inProgressImage: action.image,
					state: "uploading",
				};
			case ActionTypes.IMAGE_COMPLETED:
				return {
					...state,
					completedImages: state.completedImages++,
					inProgressImage: null,
					state: state.queuedImages.length === 0 ? "completed" : "working",
				};
			case ActionTypes.RESET_COMPLETED_IMAGES:
				return {
					...state,
					completedImages: 0,
					state: state.state === "completed" ? "idle" : state.state,
				};
			default:
				return state;
		}
	};

	useInterval(() => {
		if (!state.inProgressImage && state.queuedImages.length > 0) {
			const image = state.queuedImages[0];
			uploadingImage(image);
			getSignedUrl(username, "X")
				.then((url) => fetch(url, { body: image, method: "PUT" }))
				.then(() => {
					completedImage(image);
					//   revalidateGallery(username)
				})
				.catch((e) => {
					console.error(e);
					toast.error("Upload failed, adding image back to queue...");
					addImage(image);
				});
		}
	}, 100);

	const [state, dispatch] = useReducer(reducer, initState);

	const command = (action: ActionTypes, payload: File | null): Action => ({
		type: action,
		image: payload,
	});
	const addImage = (image: File) =>
		dispatch(command(ActionTypes.ADD_IMAGE, image));
	const completedImage = (image: File) =>
		dispatch(command(ActionTypes.IMAGE_COMPLETED, image));
	const uploadingImage = (image: File) =>
		dispatch(command(ActionTypes.UPLOAD_IMAGE, image));
	const resetCompletedImages = () =>
		dispatch(command(ActionTypes.RESET_COMPLETED_IMAGES, null));

	return [state, { addImage, resetCompletedImages }];
}