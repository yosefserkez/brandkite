import type { BrandModuleType } from "@convex/workflows";
import type { ComponentType } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import ColorsModule from "./ColorsModule";
import GenericModule from "./GenericModule";
import LogoModule from "./LogoModule";
import NamesModule from "./NamesModule";
import ValuesModule from "./ValuesModule";
import VisionModule from "./VisionModule";

export type ModuleEntryProps = {
	companyId: Id<"companies">;
	moduleType?: BrandModuleType;
	title?: string;
	icon?: string;
	className?: string;
};

export const moduleComponents: Record<
	string,
	ComponentType<ModuleEntryProps>
> = {
	vision: VisionModule,
	values: ValuesModule,
	colors: ColorsModule,
	names: NamesModule,
	logo: LogoModule,
	generic: GenericModule,
};
