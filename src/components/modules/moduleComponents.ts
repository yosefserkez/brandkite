import type { ComponentType } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import ColorsModule from "./ColorsModule";
import GenericModule from "./GenericModule";
import ValuesModule from "./ValuesModule";
import VisionModule from "./VisionModule";

export type ModuleEntryProps = {
	companyId: Id<"companies">;
	moduleType?: string;
	title?: string;
	icon?: string;
};

export const moduleComponents: Record<
	string,
	ComponentType<ModuleEntryProps>
> = {
	vision: VisionModule,
	values: ValuesModule,
	colors: ColorsModule,
	generic: GenericModule,
};
