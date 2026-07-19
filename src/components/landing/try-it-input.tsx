import { IconArrowRight } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TryItInputProps = {
	onSubmit: (value: string) => void;
	className?: string;
	placeholder?: string;
	buttonLabel?: string;
};

export function TryItInput({
	onSubmit,
	className,
	placeholder = "Enter your website or describe your idea…",
	buttonLabel = "Generate my kit",
}: TryItInputProps) {
	const [value, setValue] = useState("");

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		onSubmit(value);
	};

	return (
		<form
			className={cn(
				"group flex w-full items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md hover:border-gray-300",
				className
			)}
			onSubmit={handleSubmit}
		>
			<input
				className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-gray-900 outline-none placeholder:text-gray-400 md:text-[15px]"
				onChange={(event) => setValue(event.target.value)}
				placeholder={placeholder}
				type="text"
				value={value}
			/>
			<Button className="rounded-xl" size="lg" type="submit">
				{buttonLabel}
				<IconArrowRight className="size-4" />
			</Button>
		</form>
	);
}
