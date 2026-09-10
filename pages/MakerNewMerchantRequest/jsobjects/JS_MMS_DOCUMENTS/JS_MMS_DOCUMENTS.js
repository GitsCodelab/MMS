export default {
uploadAll: async () => {

    const selectedFiles = files.files || [];

    if (selectedFiles.length === 0) {
        showAlert(
            "Please select at least one document",
            "warning"
        );

        return {
            success: false,
            uploaded: 0,
            failed: 0,
            errors: [],
            requestId: JS_LIB.getRequestId()
        };
    }

    const requestId = JS_LIB.getRequestId();

    if (!requestId) {
        showAlert(
            "Request ID is missing",
            "error"
        );

        return {
            success: false,
            uploaded: 0,
            failed: selectedFiles.length,
            errors: ["Request ID is missing"],
            requestId: ""
        };
    }

    const uploadedBy = appsmith.user.username;

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const selectedFile of selectedFiles) {

        try {

            const result = await api_doc_upload.run({
                requestId: requestId,
                uploadedBy: uploadedBy,
                documentType: "CR",
                file: selectedFile
            });

            console.log(
                "Document upload result:",
                selectedFile.name,
                result
            );

            successCount++;

        } catch (error) {

            failedCount++;

            const errorMessage =
                error?.message ||
                String(error);

            errors.push({
                fileName: selectedFile.name,
                error: errorMessage
            });

            console.log(
                `Failed to upload ${selectedFile.name}:`,
                error
            );
        }
    }

    return {
        success: failedCount === 0,
        uploaded: successCount,
        failed: failedCount,
        errors: errors,
        requestId: requestId
    };
}


};