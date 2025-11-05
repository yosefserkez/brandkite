import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type CompanyListProps = {
	selectedCompanyId: Id<"companies"> | null;
	onSelectCompany: (id: Id<"companies">) => void;
};

export function CompanyList({
	selectedCompanyId,
	onSelectCompany,
}: CompanyListProps) {
	const companies = useQuery(api.companies.list) || [];
	const navigate = useNavigate();

	return (
		<div className="space-y-2 p-4">
			{companies.map((company) => (
				<button
					className={`w-full rounded-lg p-3 text-left transition-colors ${
						selectedCompanyId === company._id
							? "border border-blue-200 bg-blue-50"
							: "border border-transparent hover:bg-gray-50"
					}`}
					key={company._id}
					onClick={() => onSelectCompany(company._id)}
				>
					<div className="truncate font-medium text-gray-900">
						{company.name}
					</div>
					<div className="mt-1 truncate text-gray-500 text-sm">
						{company.description}
					</div>
				</button>
			))}

			<button
				className="w-full rounded-lg border-2 border-gray-300 border-dashed p-3 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600"
				onClick={() => navigate({ to: "/c/new" })}
				type="button"
			>
				+ New Company
			</button>
		</div>
	);
}
