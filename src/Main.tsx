import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { CompanyList } from "@/components/CompanyList";
import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import type { Id } from "../convex/_generated/dataModel";

export default function Main() {
	const [selectedCompanyId, setSelectedCompanyId] =
		useState<Id<"companies"> | null>(null);

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Authenticated>
				<CompanySidebar
					onSelectCompany={setSelectedCompanyId}
					selectedCompanyId={selectedCompanyId}
				/>
				<div className="flex flex-1 flex-col">
					<main className="flex-1 overflow-hidden">
						{selectedCompanyId ? (
							<BrandStudioPage companyId={selectedCompanyId} />
						) : (
							<div className="flex h-full items-center justify-center">
								<div className="text-center">
									<h2 className="mb-2 font-semibold text-2xl text-gray-900">
										Select a company to get started
									</h2>
									<p className="text-gray-600">
										Choose a company from the sidebar or{" "}
										<a
											className="text-primary underline-offset-2 hover:text-primary/80"
											href="/c/new"
										>
											Create a New Company
										</a>
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
