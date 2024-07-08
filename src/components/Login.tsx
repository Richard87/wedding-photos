import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

export function Login () {
    const searchParams = useSearchParams()
	const [username, setUsername] = useState<string>("");

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		await signIn("credentials", {
			username: username,
			callbackUrl: `/gallery/${username}`,
		});
	};
    
    return <form className="space-y-6" onSubmit={handleSubmit}>
    <div>
        <label
            htmlFor="username"
            className="block text-sm font-medium leading-6 text-gray-900"
        >
            Username
        </label>
        <div className="mt-2">
            <input
                id="username"
                name="username"
                type="text"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
        </div>
    </div>
    <div>
        <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
            Sign in
        </button>
    </div>
    {searchParams.get("error") && (
        <p className="text-red-600 text-center capitalize">
            Login failed.
        </p>
    )}
</form>
}