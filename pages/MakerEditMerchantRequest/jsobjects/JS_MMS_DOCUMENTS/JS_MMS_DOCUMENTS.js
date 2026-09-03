export default {
	async uploadAll() {

		const selectedFiles = files.files || [];

		if (selectedFiles.length === 0) {
			showAlert("Please select at least one document", "warning");
			return;
		}
		// JS_MMS_MAKER_REQUEST.getRequestId()
		const requestId = "{{appsmith.URL.queryParams.requestId}}";
		const uploadedBy = appsmith.user.username;

		let successCount = 0;
		let failedCount = 0;

		for (const selectedFile of selectedFiles) {

			try {

				await api_doc_upload.run({
					requestId: requestId,
					documentType: "CR",
					uploadedBy: uploadedBy,
					file: selectedFile
				});

				successCount++;

			} catch (error) {

				failedCount++;

				console.log(
					`Failed to upload ${selectedFile.name}`,
					error
				);
			}
		}

		if (failedCount === 0) {
			showAlert(
				`${successCount} document(s) uploaded successfully`,
				"success"
			);
		} else {
			showAlert(
				`${successCount} uploaded, ${failedCount} failed`,
				"warning"
			);
		}
	}
}