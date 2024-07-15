import type { Metadata } from "next";


export const metadata: Metadata = {
	title: "K ♡ R = Wedding",
	description: "Kristiya ♡ Richard = Wedding",
};

export default function GalleryLayout(props: {children: React.ReactNode}) {
	return props.children;
}
