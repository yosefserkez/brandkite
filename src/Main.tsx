import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { CompanyDashboard } from "@/components/CompanyDashboard";
import { CompanyList } from "@/components/CompanyList";
import { SignOutButton } from "@/components/SignOutButton";
import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import type { Id } from "../convex/_generated/dataModel";

export default function Main() {
	const [selectedCompanyId, setSelectedCompanyId] =
		useState<Id<"companies"> | null>(null);
	const [view, setView] = useState<"dashboard" | "studio">("studio");

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Authenticated>
				<CompanySidebar
					onSelectCompany={setSelectedCompanyId}
					selectedCompanyId={selectedCompanyId}
				/>
				<div className="flex flex-1 flex-col">
					<Header onViewChange={setView} view={view} />
					<main className="flex-1 overflow-hidden">
						{selectedCompanyId ? (
							view === "studio" ? (
								<BrandStudioPage companyId={selectedCompanyId} />
							) : (
								<CompanyDashboard companyId={selectedCompanyId} />
							)
						) : (
							<div className="flex h-full items-center justify-center">
								<div className="text-center">
									<h2 className="mb-2 font-semibold text-2xl text-gray-900">
										Select a company to get started
									</h2>
									<p className="text-gray-600">
										Choose a company from the sidebar or create a new one
									</p>
								</div>
							</div>
						)}
					</main>
				</div>
			</Authenticated>

			<Unauthenticated>
				<div className="flex w-full items-center justify-center p-8">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-8 text-center">
							<h1 className="mb-4 font-bold text-4xl text-gray-900">
								Brand Identity Manager
							</h1>
							<p className="text-gray-600 text-xl">
								Create and manage your company's complete brand identity
							</p>
						</div>
						<SignInFormEmailLink />
					</div>
				</div>
			</Unauthenticated>

			<Toaster />
		</div>
	);
}

function Header({
	view,
	onViewChange,
}: {
	view: "dashboard" | "studio";
	onViewChange: (view: "dashboard" | "studio") => void;
}) {
	return (
		<header className="flex items-center justify-between border-gray-200 border-b bg-white px-6 py-4">
			<div className="flex items-center gap-4">
				<h1 className="font-semibold text-gray-900 text-xl">
					Brand Identity Manager
				</h1>
				<div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
					<button
						className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
							view === "dashboard"
								? "bg-white font-medium text-gray-900 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
						onClick={() => onViewChange("dashboard")}
						type="button"
					>
						Dashboard
					</button>
					<button
						className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
							view === "studio"
								? "bg-white font-medium text-gray-900 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
						onClick={() => onViewChange("studio")}
						type="button"
					>
						Studio
					</button>
				</div>
			</div>
			<SignOutButton />
		</header>
	);
}

function CompanySidebar({
	selectedCompanyId,
	onSelectCompany,
}: {
	selectedCompanyId: Id<"companies"> | null;
	onSelectCompany: (id: Id<"companies"> | null) => void;
}) {
	return (
		<div className="flex w-64 flex-col border-gray-200 border-r bg-white">
			<div className="border-gray-200 border-b p-4">
				<h2 className="font-semibold text-gray-900">Companies</h2>
			</div>
			<div className="flex-1 overflow-y-auto">
				<CompanyList
					onSelectCompany={onSelectCompany}
					selectedCompanyId={selectedCompanyId}
				/>
			</div>
		</div>
	);
}
