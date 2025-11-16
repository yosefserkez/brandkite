export default {
	providers: [
		{
			domain: process.env.CONVEX_SITE_URL,
			applicationID: "convex",
			profileFields: ["name", "email"],
		},
	],
};
