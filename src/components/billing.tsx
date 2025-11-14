import { useCustomer } from "autumn-js/react";
import PricingTable from "@/components/autumn/pricing-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

type BillingProps = {
	open: boolean;
	setOpen?: (open: boolean) => void;
};

const freeItems = [
	{
		primaryText: "Limited Usage",
	},
	{
		primaryText: "One Company",
		secondaryText: "Generate a brand for one company",
	},
];
const starterItems = [
	{
		primaryText: "More Usage",
		secondaryText: "per month",
	},
	{
		primaryText: "One Company",
		secondaryText: "Generate a brand for one company",
	},
];

const proItems = [
	{
		primaryText: "5x more usage",
		secondaryText: "per month",
	},
	{
		primaryText: "Multiple companies",
		secondaryText: "Generate brands for unlimited companies",
	},
];

const productDetails = [
	{
		id: "free",
		description: "Try it out for free",
		items: [...freeItems],
	},
	{
		id: "starter",
		description: "For individuals to try things out",
		price: {
			primaryText: "$10/month",
			secondaryText: "billed monthly",
		},
		items: [...starterItems],
	},
	{
		id: "starter-annual",
		description: "For individuals to try things out",
		price: {
			primaryText: "$100/year",
			secondaryText: "billed annually",
		},
		items: [...starterItems],
	},
	{
		id: "pro",
		description: "For small teams and individuals",
		price: {
			primaryText: "$30/month",
			secondaryText: "billed monthly",
		},
		items: [...proItems],
	},
	{
		id: "pro-annual",
		description: "For small teams and individuals",
		price: {
			primaryText: "$300/year",
			secondaryText: "billed annually",
		},
		items: [...proItems],
	},
];

export function Billing({ open, setOpen }: BillingProps) {
	const { openBillingPortal } = useCustomer();

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Billing</DialogTitle>
				</DialogHeader>
				<PricingTable productDetails={productDetails} />
				<div className="flex justify-center">
					<Button
						className="text-xs opacity-50 hover:opacity-100"
						onClick={async () => {
							await openBillingPortal({
								returnUrl: `${window.location.href}`,
							});
						}}
						variant="link"
					>
						Manage Billing
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
