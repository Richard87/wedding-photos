"use client";

import { revalidateGallery } from "@/server/actions";
import { useInterval } from "@chakra-ui/react";
import { useReducer } from "react";
import { toast } from "react-toastify";

export type GetSignedUploadUrlFunc = (
	username: string,
	ratio: string,
) => Promise<[string, string]>;
export type GetSignedFetchUrlFunc = (
	filename: string,
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
    getSignedUploadUrl: GetSignedUploadUrlFunc, 
    getSignedFetchUrl: GetSignedFetchUrlFunc ,
    onUploadedImage: (filename:string, url: string) => unknown,
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
				// if (state.queuedImages.length === 0) revalidateGallery(username);

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
			getSignedUploadUrl(username, "X")
				.then(([filename, url]) => {
                    fetch(url, { body: image, method: "PUT" })
                    return Promise.resolve(filename)
                })
                .then(filename => getSignedFetchUrl(filename).then(url => Promise.resolve([filename, url])))
				.then(([filename, url]) => {
					completedImage(image);
                    onUploadedImage(filename, url)
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
