"use client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { CheckoutParams, CheckoutResult, ProductItem } from "autumn-js";
import { useCustomer } from "autumn-js/react";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { track } from "@/lib/analytics";
import { getCheckoutContent } from "@/lib/autumn/checkout-content";
import { cn } from "@/lib/utils";

export interface CheckoutDialogProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	checkoutResult: CheckoutResult;
	checkoutParams?: CheckoutParams;
}

const formatCurrency = ({
	amount,
	currency,
}: {
	amount: number;
	currency: string;
}) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount);

export default function CheckoutDialog(params: CheckoutDialogProps) {
	const { attach } = useCustomer();
	const [checkoutResult, setCheckoutResult] = useState<
		CheckoutResult | undefined
	>(params?.checkoutResult);

	useEffect(() => {
		if (params.checkoutResult) {
			setCheckoutResult(params.checkoutResult);
			track("checkout_started", {
				plan: params.checkoutResult.product.id,
			});
		}
	}, [params.checkoutResult]);

	const [loading, setLoading] = useState(false);

	if (!checkoutResult) {
		return <></>;
	}

	const { open, setOpen } = params;
	const { title, message } = getCheckoutContent(checkoutResult);

	const isFree = checkoutResult?.product.properties?.is_free;
	const isPaid = isFree === false;

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent className="gap-0 p-0 pt-4 text-foreground text-sm">
				<DialogTitle className="mb-1 px-6">{title}</DialogTitle>
				<div className="mt-1 mb-4 px-6 text-muted-foreground">{message}</div>

				{isPaid && checkoutResult && (
					<PriceInformation
						checkoutResult={checkoutResult}
						setCheckoutResult={setCheckoutResult}
					/>
				)}

				<DialogFooter className="flex flex-col justify-between gap-x-4 border-t bg-secondary py-2 pr-3 pl-6 shadow-inner sm:flex-row">
					<Button
						className="flex min-w-16 items-center gap-2"
						disabled={loading}
						onClick={async () => {
							setLoading(true);

							const options = checkoutResult.options.map((option) => ({
								featureId: option.feature_id,
								quantity: option.quantity,
							}));

							const res = await attach({
								productId: checkoutResult.product.id,
								...(params.checkoutParams || {}),
								options,
								successUrl: window.location.href,
							});

							if (res?.error) {
								toast.error(
									res.error.message ?? "Checkout failed. Please try again."
								);
								setLoading(false);
								return;
							}

							// A checkout_url means payment is required — send the user to
							// Stripe Checkout to enter a card before access is granted.
							const checkoutUrl = (res?.data as { checkout_url?: string })
								?.checkout_url;
							if (checkoutUrl) {
								window.location.href = checkoutUrl;
								return;
							}

							// No checkout_url: applied immediately (free plan or existing
							// card), so the purchase is complete.
							track("plan_purchased", {
								plan: checkoutResult.product.id,
								is_free: checkoutResult.product.properties?.is_free,
							});
							setOpen(false);
							setLoading(false);
						}}
						size="sm"
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<span className="flex gap-1 whitespace-nowrap">Confirm</span>
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function PriceInformation({
	checkoutResult,
	setCheckoutResult,
}: {
	checkoutResult: CheckoutResult;
	setCheckoutResult: (checkoutResult: CheckoutResult) => void;
}) {
	return (
		<div className="mb-4 flex flex-col gap-4 px-6">
			<ProductItems
				checkoutResult={checkoutResult}
				setCheckoutResult={setCheckoutResult}
			/>

			<div className="flex flex-col gap-2">
				{checkoutResult?.has_prorations && checkoutResult.lines.length > 0 && (
					<CheckoutLines checkoutResult={checkoutResult} />
				)}
				<DueAmounts checkoutResult={checkoutResult} />
			</div>
		</div>
	);
}

function DueAmounts({ checkoutResult }: { checkoutResult: CheckoutResult }) {
	const { next_cycle, product } = checkoutResult;
	const nextCycleAtStr = next_cycle
		? new Date(next_cycle.starts_at).toLocaleDateString()
		: undefined;

	const hasUsagePrice = product.items.some(
		(item) => item.usage_model === "pay_per_use"
	);

	const showNextCycle = next_cycle && next_cycle.total !== checkoutResult.total;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex justify-between">
				<div>
					<p className="font-medium text-md">Total due today</p>
				</div>

				<p className="font-medium text-md">
					{formatCurrency({
						amount: checkoutResult?.total,
						currency: checkoutResult?.currency,
					})}
				</p>
			</div>
			{showNextCycle && (
				<div className="flex justify-between text-muted-foreground">
					<div>
						<p className="text-md">Due next cycle ({nextCycleAtStr})</p>
					</div>
					<p className="text-md">
						{formatCurrency({
							amount: next_cycle.total,
							currency: checkoutResult?.currency,
						})}
						{hasUsagePrice && <span> + usage prices</span>}
					</p>
				</div>
			)}
		</div>
	);
}

function ProductItems({
	checkoutResult,
	setCheckoutResult,
}: {
	checkoutResult: CheckoutResult;
	setCheckoutResult: (checkoutResult: CheckoutResult) => void;
}) {
	const isUpdateQuantity =
		checkoutResult?.product.scenario === "active" &&
		checkoutResult.product.properties.updateable;

	const isOneOff = checkoutResult?.product.properties.is_one_off;

	return (
		<div className="flex flex-col gap-2">
			<p className="font-medium text-sm">Price</p>
			{checkoutResult?.product.items
				.filter((item) => item.type !== "feature")
				.map((item, index) => {
					if (item.usage_model == "prepaid") {
						return (
							<PrepaidItem
								checkoutResult={checkoutResult!}
								item={item}
								key={index}
								setCheckoutResult={setCheckoutResult}
							/>
						);
					}

					if (isUpdateQuantity) {
						return null;
					}

					return (
						<div className="flex justify-between" key={index}>
							<p className="text-muted-foreground">
								{item.feature
									? item.feature.name
									: isOneOff
										? "Price"
										: "Subscription"}
							</p>
							<p>
								{item.display?.primary_text} {item.display?.secondary_text}
							</p>
						</div>
					);
				})}
		</div>
	);
}

function CheckoutLines({ checkoutResult }: { checkoutResult: CheckoutResult }) {
	return (
		<Accordion collapsible type="single">
			<AccordionItem className="border-b-0" value="total">
				<CustomAccordionTrigger className="my-0 w-full justify-between border-none py-0">
					<div className="flex w-full cursor-pointer items-center justify-end gap-1">
						<p className="font-light text-muted-foreground">View details</p>
						<ChevronDown
							className="mt-0.5 rotate-90 text-muted-foreground transition-transform duration-200 ease-in-out"
							size={14}
						/>
					</div>
				</CustomAccordionTrigger>
				<AccordionContent className="mt-2 mb-0 flex flex-col gap-2 pb-2">
					{checkoutResult?.lines
						.filter((line) => line.amount !== 0)
						.map((line, index) => (
							<div className="flex justify-between" key={index}>
								<p className="text-muted-foreground">{line.description}</p>
								<p className="text-muted-foreground">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: checkoutResult?.currency,
									}).format(line.amount)}
								</p>
							</div>
						))}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

function CustomAccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				className={cn(
					"flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]_svg]:rotate-0",
					className
				)}
				data-slot="accordion-trigger"
				{...props}
			>
				{children}
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

const PrepaidItem = ({
	item,
	checkoutResult,
	setCheckoutResult,
}: {
	item: ProductItem;
	checkoutResult: CheckoutResult;
	setCheckoutResult: (checkoutResult: CheckoutResult) => void;
}) => {
	const { quantity = 0, billing_units: billingUnits = 1 } = item;
	const [quantityInput, setQuantityInput] = useState<string>(
		(quantity / billingUnits).toString()
	);
	const { checkout } = useCustomer();
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const scenario = checkoutResult.product.scenario;

	const handleSave = async () => {
		setLoading(true);
		try {
			const newOptions = checkoutResult.options
				.filter((option) => option.feature_id !== item.feature_id)
				.map((option) => ({
					featureId: option.feature_id,
					quantity: option.quantity,
				}));

			newOptions.push({
				featureId: item.feature_id!,
				quantity: Number(quantityInput) * billingUnits,
			});

			const { data, error } = await checkout({
				productId: checkoutResult.product.id,
				options: newOptions,
				dialog: CheckoutDialog,
			});

			if (error) {
				console.error(error);
				return;
			}
			setCheckoutResult(data!);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
			setOpen(false);
		}
	};

	const disableSelection = scenario === "renew";

	return (
		<div className="flex justify-between gap-2">
			<div className="flex items-start gap-2">
				<p className="whitespace-nowrap text-muted-foreground">
					{item.feature?.name}
				</p>
				<Popover onOpenChange={setOpen} open={open}>
					<PopoverTrigger
						className={cn(
							"flex shrink-0 items-center gap-1 rounded-md bg-accent/80 px-1 py-0.5 text-muted-foreground text-xs",
							disableSelection !== true &&
								"hover:bg-accent hover:text-foreground",
							disableSelection &&
								"pointer-events-none cursor-not-allowed opacity-80"
						)}
						disabled={disableSelection}
					>
						Qty: {quantity}
						{!disableSelection && <ChevronDown size={12} />}
					</PopoverTrigger>
					<PopoverContent
						align="start"
						className="flex w-80 flex-col gap-4 p-4 pt-3 text-sm"
					>
						<div className="flex flex-col gap-1">
							<p className="font-medium text-sm">{item.feature?.name}</p>
							<p className="text-muted-foreground">
								{item.display?.primary_text} {item.display?.secondary_text}
							</p>
						</div>

						<div className="flex items-end justify-between">
							<div className="flex items-center gap-2">
								<Input
									className="focus:!ring-2 h-7 w-16"
									onChange={(e) => setQuantityInput(e.target.value)}
									value={quantityInput}
								/>
								<p className="text-muted-foreground">
									{billingUnits > 1 && `x ${billingUnits} `}
									{item.feature?.name}
								</p>
							</div>

							<Button
								className="!h-7 w-14 items-center border border-zinc-200 bg-white text-foreground text-sm shadow-sm hover:bg-zinc-100"
								disabled={loading}
								onClick={handleSave}
							>
								{loading ? (
									<Loader2 className="!w-4 !h-4 animate-spin text-muted-foreground" />
								) : (
									"Save"
								)}
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</div>
			<p className="text-end">
				{item.display?.primary_text} {item.display?.secondary_text}
			</p>
		</div>
	);
};

export const PriceItem = ({
	children,
	className,
	...props
}: {
	children: React.ReactNode;
	className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col justify-between gap-1 pb-4 sm:h-7 sm:flex-row sm:items-center sm:gap-2 sm:pb-0",
			className
		)}
		{...props}
	>
		{children}
	</div>
);

export const PricingDialogButton = ({
	children,
	size,
	onClick,
	disabled,
	className,
}: {
	children: React.ReactNode;
	size?: "sm" | "lg" | "default" | "icon";
	onClick: () => void;
	disabled?: boolean;
	className?: string;
}) => (
	<Button
		className={cn(className, "shadow-sm shadow-stone-400")}
		disabled={disabled}
		onClick={onClick}
		size={size}
	>
		{children}
		<ArrowRight className="!h-3" />
	</Button>
);
