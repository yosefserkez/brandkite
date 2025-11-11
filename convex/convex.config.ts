// convex/convex.config.ts
import r2 from "@convex-dev/r2/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(workflow);
app.use(r2);
export default app;
