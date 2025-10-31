import type { BrandModuleType } from "@convex/workflows/modules";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type GenerationStatus =
	| "idle"
	| "queued"
	| "in_progress"
	| "succeeded"
	| "failed";

export interface BrandModuleVersionDoc {
	_id: Id<"brandModules">;
	companyId: Id<"companies">;
	type: BrandModuleType;
	data: unknown;
	published: boolean;
	generationStatus: GenerationStatus;
	createdAt: number;
	computedVersion?: number;
}

export interface UseBrandModuleResult {
	versions: BrandModuleVersionDoc[];
	selected: BrandModuleVersionDoc | null;
	selectedId: Id<"brandModules"> | null;
	setSelectedId: (id: Id<"brandModules">) => void;
	isPublishing: boolean;
	isSaving: boolean;
	isRegenerating: boolean;
	publishSelected: () => Promise<void>;
	saveSelected: (nextData: unknown) => Promise<void>;
	regenerate: (publish?: boolean) => Promise<void>;
}

export function useBrandModule(
	companyId: Id<"companies">,
	moduleType: BrandModuleType,
): UseBrandModuleResult {
	const versions = useQuery(api.brandModules.getModulesByType, {
		companyId,
		type: moduleType,
	}) as BrandModuleVersionDoc[] | undefined;
	const updateModule = useMutation(api.brandModules.updateModule);
	const regenerateModule = useMutation(api.brandModules.regenerateModule);

	const [selectedId, setSelectedId] = useState<Id<"brandModules"> | null>(null);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [shouldSelectNewestAfterRegen, setShouldSelectNewestAfterRegen] =
		useState(false);
	const [regenRequestedAt, setRegenRequestedAt] = useState<number | null>(null);

	useEffect(() => {
		if (versions && versions.length > 0 && !selectedId) {
			const preferred = versions.find((v) => v.published) ?? versions[0];
			setSelectedId(preferred._id);
		}
	}, [versions, selectedId]);

	// After regeneration, when the server pushes the new version, select the newest one
	useEffect(() => {
		if (!shouldSelectNewestAfterRegen) return;
		if (!versions || versions.length === 0) return;

		const newest = [...versions].sort(
			(a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
		)[0];

		const threshold = regenRequestedAt ?? 0;
		const newestCreatedAt = newest?.createdAt ?? 0;

		// Only switch once a version created at/after the regeneration request appears
		if (newest && newestCreatedAt >= threshold && newest._id !== selectedId) {
			setSelectedId(newest._id);
			setShouldSelectNewestAfterRegen(false);
			setRegenRequestedAt(null);
		}
		// Otherwise, keep waiting for the new version to arrive
	}, [versions, selectedId, shouldSelectNewestAfterRegen, regenRequestedAt]);

	const withComputedVersions = useMemo(() => {
		if (!versions) return [] as BrandModuleVersionDoc[];
		const asc = [...versions].sort(
			(a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
		);
		const versionMap = new Map<string, number>();
		for (const [i, m] of asc.entries()) {
			versionMap.set(m._id as unknown as string, i + 1);
		}
		return versions.map((m) => ({
			...m,
			computedVersion: versionMap.get(m._id as unknown as string),
		}));
	}, [versions]);

	const selected = useMemo(() => {
		if (!withComputedVersions || !selectedId) return null;
		return withComputedVersions.find((v) => v._id === selectedId) ?? null;
	}, [withComputedVersions, selectedId]);

	const publishSelected = useCallback(async () => {
		if (!selected) return;
		setIsPublishing(true);
		try {
			await updateModule({
				companyId,
				moduleId: selected._id,
				type: moduleType,
				data: selected.data ?? {},
				publish: true,
			});
		} finally {
			setIsPublishing(false);
		}
	}, [companyId, moduleType, selected, updateModule]);

	const saveSelected = useCallback(
		async (nextData: unknown) => {
			if (!selected) return;
			setIsSaving(true);
			try {
				await updateModule({
					companyId,
					moduleId: selected._id,
					type: moduleType,
					data: nextData,
				});
			} finally {
				setIsSaving(false);
			}
		},
		[companyId, moduleType, selected, updateModule],
	);

	const regenerate = useCallback(
		async (publish?: boolean) => {
			setIsRegenerating(true);
			setShouldSelectNewestAfterRegen(true);
			setRegenRequestedAt(Date.now());
			try {
				await regenerateModule({
					companyId,
					type: moduleType,
					publish: publish ?? false,
				});
			} finally {
				setIsRegenerating(false);
			}
		},
		[companyId, moduleType, regenerateModule],
	);

	return {
		versions: withComputedVersions ?? [],
		selected,
		selectedId,
		setSelectedId,
		isPublishing,
		isSaving,
		isRegenerating,
		publishSelected,
		saveSelected,
		regenerate,
	};
}
