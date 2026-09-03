export default {

	generateRequestId: async () => {
		const requestId = crypto
		.randomUUID()
		.replace(/-/g, "")
		.toUpperCase();

		await storeValue("MMS_REQUEST_ID", requestId);

		return requestId;
	},
	getRequestId: () => {
		return appsmith.store.MMS_REQUEST_ID || "";
	},
}