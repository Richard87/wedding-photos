"use server"
import { revalidatePath } from "next/cache"

export async function revalidateGallery(username: string) {
	revalidatePath(`/gallery/${username}`)
}
