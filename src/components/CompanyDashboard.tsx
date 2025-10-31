import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { moduleComponents } from "./modules/moduleComponents";
import { PresenceIndicator } from "./PresenceIndicator";

interface CompanyDashboardProps {
	companyId: Id<"companies">;
}

export function CompanyDashboard({ companyId }: CompanyDashboardProps) {
	const company = useQuery(api.companies.get, { companyId });
	const moduleTypes = useQuery(api.brandModules.listModuleTypes, { companyId });
	const updatePresence = useMutation(api.presence.updatePresence);

	useEffect(() => {
		updatePresence({ companyId });
		const interval = setInterval(() => {
			updatePresence({ companyId });
		}, 30000); // Update every 30 seconds

		return () => clearInterval(interval);
	}, [companyId, updatePresence]);

	const types = moduleTypes ?? [];

	if (!company) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			{/* Header */}
			<div className="bg-white border-b border-gray-200">
				<div className="px-8 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
								{company.name.charAt(0).toUpperCase()}
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									{company.name}
								</h1>
								<p className="text-gray-600">{company.description}</p>
							</div>
						</div>
						<PresenceIndicator companyId={companyId} />
					</div>
				</div>
			</div>

			{/* Brand Modules */}
			<div className="px-8 py-6 space-y-6">
				<moduleComponents.vision companyId={companyId} />
				<moduleComponents.values companyId={companyId} />
				<moduleComponents.colors companyId={companyId} />
				{types.map((type) => (
					<moduleComponents.generic
						companyId={companyId}
						moduleType={type}
						key={type}
						title={type}
						icon={type.charAt(0).toUpperCase()}
					/>
				))}
			</div>
		</div>
	);
}
