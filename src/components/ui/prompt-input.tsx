"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const setValueNoop = (_value: string) => {
	// noop
};

const focusNoop = (_event: React.FocusEvent<HTMLTextAreaElement>) => {
	// noop
};

type PromptInputContextType = {
	isLoading: boolean;
	value: string;
	setValue: (value: string) => void;
	maxHeight: number | string;
	onSubmit?: () => void;
	disabled?: boolean;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	onFocusTextarea: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	onBlurTextarea: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
	isFocused: boolean;
};

const PromptInputContext = createContext<PromptInputContextType>({
	isLoading: false,
	value: "",
	setValue: setValueNoop,
	maxHeight: 240,
	onSubmit: undefined,
	disabled: false,
	textareaRef: React.createRef<HTMLTextAreaElement>(),
	onFocusTextarea: focusNoop,
	onBlurTextarea: focusNoop,
	isFocused: false,
});

function usePromptInput() {
	const context = useContext(PromptInputContext);
	if (!context) {
		throw new Error("usePromptInput must be used within a PromptInput");
	}
	return context;
}

type PromptInputProps = {
	isLoading?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
	maxHeight?: number | string;
	onSubmit?: () => void;
	onFocusChange?: (isFocused: boolean) => void;
	children: React.ReactNode;
	className?: string;
};

function PromptInput({
	className,
	isLoading = false,
	maxHeight = 240,
	value,
	onValueChange,
	onSubmit,
	onFocusChange,
	children,
}: PromptInputProps) {
	const [internalValue, setInternalValue] = useState(value || "");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [dynamicMaxHeight, setDynamicMaxHeight] = useState<number | string>(
		maxHeight
	);

	useEffect(() => {
		if (!isFocused) {
			setDynamicMaxHeight(maxHeight);
		}
	}, [isFocused, maxHeight]);

	const updateAvailableHeight = React.useCallback(() => {
		if (!(containerRef.current && textareaRef.current)) {
			return;
		}

		const containerRect = containerRef.current.getBoundingClientRect();
		const textareaRect = textareaRef.current.getBoundingClientRect();
		const nonTextareaHeight = containerRect.height - textareaRect.height;
		const verticalPadding = 32;
		const availableTextareaHeight =
			window.innerHeight -
			containerRect.top -
			verticalPadding -
			nonTextareaHeight;

		if (
			Number.isFinite(availableTextareaHeight) &&
			availableTextareaHeight > 0
		) {
			setDynamicMaxHeight(availableTextareaHeight);
		}
	}, []);

	useEffect(() => {
		if (!isFocused) {
			return;
		}

		updateAvailableHeight();

		const handleResize = () => updateAvailableHeight();
		window.addEventListener("resize", handleResize);

		let observer: ResizeObserver | undefined;
		if ("ResizeObserver" in window && containerRef.current) {
			observer = new ResizeObserver(() => updateAvailableHeight());
			observer.observe(containerRef.current);
		}

		return () => {
			window.removeEventListener("resize", handleResize);
			observer?.disconnect();
		};
	}, [isFocused, updateAvailableHeight]);

	const handleChange = (newValue: string) => {
		setInternalValue(newValue);
		onValueChange?.(newValue);
	};

	const handleFocus = () => {
		setIsFocused(true);
		onFocusChange?.(true);
		requestAnimationFrame(() => {
			updateAvailableHeight();
		});
	};

	const handleBlur = () => {
		setIsFocused(false);
		onFocusChange?.(false);
	};

	return (
		<TooltipProvider>
			<PromptInputContext.Provider
				value={{
					isLoading,
					value: value ?? internalValue,
					setValue: onValueChange ?? handleChange,
					maxHeight,
					onSubmit,
					textareaRef,
					onFocusTextarea: handleFocus,
					onBlurTextarea: handleBlur,
					isFocused,
				}}
			>
				<div
					className={cn(
						"cursor-text rounded-3xl border border-input bg-background p-2 shadow-xs",
						className
					)}
					ref={containerRef}
				>
					{children}
				</div>
			</PromptInputContext.Provider>
		</TooltipProvider>
	);
}

export type PromptInputTextareaProps = {
	disableAutosize?: boolean;
} & React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({
	className,
	onKeyDown,
	onFocus,
	onBlur,
	disableAutosize = false,
	...props
}: PromptInputTextareaProps) {
	const {
		value,
		setValue,
		maxHeight,
		onSubmit,
		disabled,
		textareaRef,
		onFocusTextarea,
		onBlurTextarea,
		isFocused,
	} = usePromptInput();

	useEffect(() => {
		if (disableAutosize) {
			return;
		}

		const textarea = textareaRef.current;
		if (!textarea) {
			return;
		}
		const contentLength = value.length;

		if (isFocused) {
			textarea.style.height =
				typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
			return;
		}

		if (contentLength === 0 || textarea.scrollTop === 0) {
			textarea.style.height = "auto";
		}

		textarea.style.height =
			typeof maxHeight === "number"
				? `${Math.min(textarea.scrollHeight, maxHeight)}px`
				: `min(${textarea.scrollHeight}px, ${maxHeight})`;
	}, [disableAutosize, isFocused, maxHeight, value, textareaRef]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && e.metaKey) {
			e.preventDefault();
			onSubmit?.();
		}
		onKeyDown?.(e);
	};

	const handleFocusEvent = (event: React.FocusEvent<HTMLTextAreaElement>) => {
		onFocusTextarea(event);
		onFocus?.(event);
	};

	const handleBlurEvent = (event: React.FocusEvent<HTMLTextAreaElement>) => {
		onBlurTextarea(event);
		onBlur?.(event);
	};

	return (
		<Textarea
			className={cn(
				"min-h-[44px] w-full resize-none border-none bg-transparent text-primary shadow-none outline-none transition-[height] duration-200 ease-in-out focus-visible:ring-0 focus-visible:ring-offset-0",
				className
			)}
			disabled={disabled}
			onBlur={handleBlurEvent}
			onChange={(e) => setValue(e.target.value)}
			onFocus={handleFocusEvent}
			onKeyDown={handleKeyDown}
			ref={textareaRef}
			rows={1}
			value={value}
			{...props}
		/>
	);
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
	children,
	className,
	...props
}: PromptInputActionsProps) {
	return (
		<div className={cn("flex items-center gap-2", className)} {...props}>
			{children}
		</div>
	);
}

type PromptInputActionProps = {
	className?: string;
	tooltip: React.ReactNode;
	children: React.ReactNode;
	side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({
	tooltip,
	children,
	className,
	side = "top",
	...props
}: PromptInputActionProps) {
	const { disabled } = usePromptInput();

	return (
		<Tooltip {...props}>
			<TooltipTrigger
				asChild
				disabled={disabled}
				onClick={(event) => event.stopPropagation()}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent className={className} side={side}>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	);
}

export {
	PromptInput,
	PromptInputTextarea,
	PromptInputActions,
	PromptInputAction,
};
