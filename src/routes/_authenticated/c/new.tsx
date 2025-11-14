import { api } from "@convex/_generated/api";
import type { BrandContext } from "@convex/modules/brandContext";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Billing } from "@/components/billing";
import { ContextForm } from "@/components/new-company/context-form";
import { NewCompany } from "@/components/new-company/context-input";
import { ContextInputProcessing } from "@/components/new-company/context-input-processing";
import { Meteors } from "@/components/ui/meteors";

export const Route = createFileRoute("/_authenticated/c/new")({
	component: NewCompanyRoute,
});

type Step = "input" | "processing" | "form";

function NewCompanyRoute() {
	const navigate = useNavigate();
	const { check } = useCustomer();
	const companies = useQuery(api.companies.listWithBrandData) || [];
	const [step, setStep] = useState<Step>("input");
	const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isInputFocused, setIsInputFocused] = useState(false);

	const processBrandInput = useAction(api.companies.processBrandInput);
	const createCompany = useMutation(api.companies.create);

	const handleInputSubmit = async (data: {
		urls: string[];
		rawText: string;
		files: { name: string; text: string }[] | undefined;
	}) => {
		if (companies.length >= 1) {
			// If user already has companies, check if they have the multiple_companies feature
			const { data: multipleCompaniesData } = check({
				featureId: "multiple_companies",
				dialog: Billing,
			});

			if (!multipleCompaniesData?.allowed) {
				toast.error("Please upgrade your plan to create multiple companies.");
				return;
			}
		}

		setStep("processing");
		setIsProcessing(true);

		try {
			const input = {
				urls: data.urls,
				rawText: data.rawText,
				files: data.files,
			};
			const result = await processBrandInput(input);
			setBrandContext(result);
			setStep("form");
			toast.success("Brand context generated successfully!");
		} catch (_error) {
			toast.error("Failed to process input");
			setStep("input");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFormSubmit = async () => {
		if (!brandContext) {
			toast.error("No brand context available");
			return;
		}

		setIsProcessing(true);
		try {
			const companyId = await createCompany({
				name: "", // Will be populated by name module
				description: "",
				isPublic: false,
				brandContext,
			});
			toast.success("Company created successfully!");
			navigate({ to: "/c/$id", params: { id: companyId } });
		} catch (_error) {
			toast.error("Failed to create company");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
			<div className="flex h-full w-full max-w-4xl flex-col overflow-hidden">
				{step === "input" && (
					<>
						<div className="relative flex h-[180px] w-full flex-col items-center overflow-hidden lg:h-[200px] lg:justify-center">
							<Meteors number={20} />
							<div className="m-auto flex flex-row flex-nowrap items-center justify-center gap-2">
								<span className="pointer-events-none whitespace-nowrap bg-linear-to-b from-black to-gray-300/80 bg-clip-text text-center font-semibold text-3xl text-transparent leading-none lg:text-7xl dark:from-white dark:to-slate-900/10">
									Whats your big idea?
								</span>
							</div>
						</div>

						<NewCompany
							onFocusChange={setIsInputFocused}
							onSubmit={handleInputSubmit}
						/>
						{/* <div
							className={cn(
								"m-auto py-8 transition-opacity duration-500 ease-in-out",
								isInputFocused
									? "pointer-events-none hidden opacity-0"
									: "opacity-100"
							)}
						>
							<ModulesMarquee />
						</div> */}
					</>
				)}
				{step === "processing" && <ContextInputProcessing />}
				{step === "form" && brandContext && (
					<ContextForm
						brandContext={brandContext}
						isSubmitting={isProcessing}
						onBrandContextChange={setBrandContext}
						onSubmit={handleFormSubmit}
					/>
				)}
			</div>
		</div>
	);
}
