import { createFileRoute } from "@tanstack/react-router";
import Main from "@/Main";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="min-h-screen ">
			<Main />
		</div>
	);
}
