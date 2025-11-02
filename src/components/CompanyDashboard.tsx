import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { moduleComponents } from "./modules/moduleComponents";
import { PresenceIndicator } from "./PresenceIndicator";

type CompanyDashboardProps = {
	companyId: Id<"companies">;
};

export function CompanyDashboard({ companyId }: CompanyDashboardProps) {
	const company = useQuery(api.companies.get, { companyId });
	const moduleTypes = useQuery(api.brandModules.listModuleTypes, { companyId });
	const updatePresence = useMutation(api.presence.updatePresence);
	const PRESENCE_UPDATE_INTERVAL_MS = 30_000; // 30 seconds

	useEffect(() => {
		updatePresence({ companyId });
		const interval = setInterval(() => {
			updatePresence({ companyId });
		}, PRESENCE_UPDATE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [companyId, updatePresence]);

	const types = moduleTypes ?? [];

	if (!company) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			{/* Header */}
			<div className="border-gray-200 border-b bg-white">
				<div className="px-8 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white text-xl">
								{company.name.charAt(0).toUpperCase()}
							</div>
							<div>
								<h1 className="font-bold text-2xl text-gray-900">
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
			<div className="space-y-6 px-8 py-6">
				<moduleComponents.vision companyId={companyId} />
				<moduleComponents.values companyId={companyId} />
				<moduleComponents.colors companyId={companyId} />
				{types.map((type) => (
					<moduleComponents.generic
						companyId={companyId}
						icon={type.charAt(0).toUpperCase()}
						key={type}
						moduleType={type}
						title={type}
					/>
				))}
			</div>
		</div>
	);
}
