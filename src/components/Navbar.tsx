import { Button, Navbar, Typography } from "@material-tailwind/react"
import React from "react"

export function NavbarDefault() {
	return (
		<Navbar
			className="mx-auto px-4 py-2 lg:px-8 lg:py-4"
			placeholder={undefined}
			onPointerEnterCapture={undefined}
			onPointerLeaveCapture={undefined}
		>
			<div className="container mx-auto flex items-center justify-between text-blue-gray-900">
				<Typography
					as="a"
					href="#"
					className="mr-4 cursor-pointer py-1.5 font-medium"
					placeholder={undefined}
					onPointerEnterCapture={undefined}
					onPointerLeaveCapture={undefined}
				>
					Material Tailwind
				</Typography>
				<div className="hidden lg:block">
					<ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
						<Typography
							as="li"
							variant="small"
							color="blue-gray"
							className="flex items-center gap-x-2 p-1 font-medium"
							placeholder={undefined}
							onPointerEnterCapture={undefined}
							onPointerLeaveCapture={undefined}
						>
							Kristiya 💖 Richards Wedding
						</Typography>
					</ul>
				</div>
				<div className="flex items-center gap-x-1">
					<Button
						variant="text"
						size="sm"
						className="hidden lg:inline-block"
						placeholder={undefined}
						onPointerEnterCapture={undefined}
						onPointerLeaveCapture={undefined}
					>
						<span>Log In</span>
					</Button>
					<Button
						variant="gradient"
						size="sm"
						className="hidden lg:inline-block"
						placeholder={undefined}
						onPointerEnterCapture={undefined}
						onPointerLeaveCapture={undefined}
					>
						<span>Sign in</span>
					</Button>
				</div>
			</div>
		</Navbar>
	)
}
