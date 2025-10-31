import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect } from "react";

interface PresenceIndicatorProps {
  companyId: Id<"companies">;
}

export function PresenceIndicator({ companyId }: PresenceIndicatorProps) {
  const presence = useQuery(api.presence.getPresence, { companyId }) || [];
  const updatePresence = useMutation(api.presence.updatePresence);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence({ companyId });
    }, 30000);

    return () => clearInterval(interval);
  }, [companyId, updatePresence]);

  if (presence.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex -space-x-2">
        {presence.slice(0, 3).map((p) => (
          <div
            key={p.userId}
            className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium"
            title={p.user?.name || p.user?.email}
          >
            {(p.user?.name || p.user?.email || "?").charAt(0).toUpperCase()}
          </div>
        ))}
        {presence.length > 3 && (
          <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
            +{presence.length - 3}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600">
        {presence.length} online
      </span>
    </div>
  );
}
