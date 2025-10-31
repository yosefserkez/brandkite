import { api } from "@convex/_generated/api";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { CompanyDashboard } from "@/components/CompanyDashboard";
import { CompanyList } from "@/components/CompanyList";
import { SignInForm } from "@/components/SignInForm";
import { SignOutButton } from "@/components/SignOutButton";
import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import { Id } from "../convex/_generated/dataModel";

export default function Main() {
	const [selectedCompanyId, setSelectedCompanyId] =
		useState<Id<"companies"> | null>(null);

	return (
		<div className="min-h-screen flex bg-gray-50">
			<Authenticated>
				<CompanySidebar
					selectedCompanyId={selectedCompanyId}
					onSelectCompany={setSelectedCompanyId}
				/>
				<div className="flex-1 flex flex-col">
					<Header />
					<main className="flex-1 overflow-hidden">
						{selectedCompanyId ? (
							<CompanyDashboard companyId={selectedCompanyId} />
						) : (
							<div className="h-full flex items-center justify-center">
								<div className="text-center">
									<h2 className="text-2xl font-semibold text-gray-900 mb-2">
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
				<div className="w-full flex items-center justify-center p-8">
					<div className="w-full max-w-md mx-auto">
						<div className="text-center mb-8">
							<h1 className="text-4xl font-bold text-gray-900 mb-4">
								Brand Identity Manager
							</h1>
							<p className="text-xl text-gray-600">
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

function Header() {
	return (
		<header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
			<h1 className="text-xl font-semibold text-gray-900">
				Brand Identity Manager
			</h1>
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
		<div className="w-64 bg-white border-r border-gray-200 flex flex-col">
			<div className="p-4 border-b border-gray-200">
				<h2 className="font-semibold text-gray-900">Companies</h2>
			</div>
			<div className="flex-1 overflow-y-auto">
				<CompanyList
					selectedCompanyId={selectedCompanyId}
					onSelectCompany={onSelectCompany}
				/>
			</div>
		</div>
	);
}
