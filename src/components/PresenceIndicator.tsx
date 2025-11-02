import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type PresenceIndicatorProps = {
	companyId: Id<"companies">;
};

export function PresenceIndicator({ companyId }: PresenceIndicatorProps) {
	const presence = useQuery(api.presence.getPresence, { companyId }) || [];
	const updatePresence = useMutation(api.presence.updatePresence);

	const PRESENCE_UPDATE_INTERVAL_MS = 30_000;
	const MAX_PRESENCE_DISPLAY_COUNT = 3;

	useEffect(() => {
		const interval = setInterval(() => {
			updatePresence({ companyId });
		}, PRESENCE_UPDATE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [companyId, updatePresence]);

	if (presence.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center space-x-2">
			<div className="-space-x-2 flex">
				{presence.slice(0, MAX_PRESENCE_DISPLAY_COUNT).map((p) => (
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 font-medium text-sm text-white"
						key={p.userId}
						title={p.user?.name || p.user?.email}
					>
						{(p.user?.name || p.user?.email || "?").charAt(0).toUpperCase()}
					</div>
				))}
				{presence.length > MAX_PRESENCE_DISPLAY_COUNT && (
					<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-400 font-medium text-white text-xs">
						+{presence.length - MAX_PRESENCE_DISPLAY_COUNT}
					</div>
				)}
			</div>
			<span className="text-gray-600 text-sm">
				{presence.length} users are online
			</span>
		</div>
	);
}
