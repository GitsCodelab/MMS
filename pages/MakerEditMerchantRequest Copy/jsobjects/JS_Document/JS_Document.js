export default {

    // =========================================================
    // DOCUMENT
    // =========================================================

    getDocumentId: () => {
        return tbldocument.triggeredRow?.DOCUMENT_ID || "";
    },

    // =========================================================
    // REQUEST
    // =========================================================

    getRequestId: () => {
        return appsmith.URL.queryParams.requestId || "";
    },

    // =========================================================
    // NORMALIZE ARABIC / PERSIAN DIGITS
    // =========================================================
    // Arabic digits:
    // ٠١٢٣٤٥٦٧٨٩
    //
    // Persian digits:
    // ۰۱۲۳۴۵۶۷۸۹
    //
    // Example:
    // ٠٠٦٠١٤٠٠٩٠٢٠٢٥١٣٥٠٠٢٩
    //
    // becomes:
    // 006014009020251350029
    //
    // NOTE:
    // This only normalizes digit characters.
    // It does NOT correct OCR recognition errors.
    // =========================================================

    normalizeDigits: (text) => {

        if (text === null || text === undefined) {
            return "";
        }

        return String(text)
            .replace(/[٠-٩]/g, digit =>
                "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
            )
            .replace(/[۰-۹]/g, digit =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
            );
    },

    // =========================================================
    // VIEW DOCUMENT
    // =========================================================

    viewDocument: async () => {

        const row = tbldocument.triggeredRow;

        if (!row?.DOCUMENT_ID) {
            showAlert(
                "Document ID is missing",
                "error"
            );
            return;
        }

        await storeValue(
            "MMS_DOCUMENT_VIEW_ID",
            row.DOCUMENT_ID
        );

        await storeValue(
            "MMS_DOCUMENT_VIEW_REQUEST_ID",
            row.REQUEST_ID
        );

        await storeValue(
            "MMS_DOCUMENT_VIEW_FILE_NAME",
            row.FILE_NAME
        );

        await storeValue(
            "MMS_DOCUMENT_VIEW_MIME_TYPE",
            row.MIME_TYPE
        );

        // Reset OCR page selection
        await storeValue(
            "MMS_SELECTED_OCR_PAGE",
            ""
        );

        await Api_doc_view.run();

        await MMS_DOCUMENT_OCR_PAGES.run();

        showModal(
            mdDcoumentView.name
        );
    },

    // =========================================================
    // OCR SCAN
    // =========================================================

    scanDocument: async () => {

        const row = tbldocument.triggeredRow;

        if (!row?.DOCUMENT_ID) {
            showAlert(
                "Document ID is missing",
                "error"
            );
            return;
        }

        // -----------------------------------------------------
        // Do not scan if OCR is already completed
        // -----------------------------------------------------

        if (row.DOCUMENT_STATUS === "OCR_PROCESSED") {

            showAlert(
                "OCR has already been processed for this document",
                "info"
            );

            return;
        }

        try {

            // -------------------------------------------------
            // Generate ONE Job ID
            // -------------------------------------------------

            const jobId =
                await JS_LIB.GenerateUUID();

            // -------------------------------------------------
            // Run OCR
            // -------------------------------------------------

            const result =
                await api_doc_scan.run({
                    documentId: row.DOCUMENT_ID,
                    requestId: row.REQUEST_ID,
                    fileName: row.FILE_NAME,
                    mimeType: row.MIME_TYPE,
                    jobId: jobId
                });

            // -------------------------------------------------
            // Check result
            // -------------------------------------------------

            if (result?.success === true) {

                await QRY_Documents.run();

                showAlert(
                    "OCR scan is finished",
                    "success"
                );

            } else {

                showAlert(
                    result?.message ||
                    "OCR scan failed",
                    "error"
                );
            }

        } catch (error) {

            console.log(
                "OCR Scan Error:",
                error
            );

            showAlert(
                "OCR scan failed to analyze the document",
                "error"
            );
        }
    },

    // =========================================================
    // UPLOAD DOCUMENTS
    // =========================================================

    uploadAll: async () => {

        const selectedFiles =
            files.files || [];

        if (selectedFiles.length === 0) {

            showAlert(
                "Please select at least one document",
                "warning"
            );

            return;
        }

        const requestId =
            appsmith.URL.queryParams.requestId || "";

        if (!requestId) {

            showAlert(
                "Request ID is missing",
                "error"
            );

            return;
        }

        const uploadedBy =
            appsmith.user.username;

        let successCount = 0;
        let failedCount = 0;

        // -----------------------------------------------------
        // Upload each file
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // Upload result
        // -----------------------------------------------------

        if (
            successCount ===
            selectedFiles.length
        ) {

            await QRY_Documents.run();

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
    },

    // =========================================================
    // SET SELECTED OCR PAGE
    // =========================================================

    setOCRPage: async () => {

        const selectedPage =
            iocr_text_pg.selectedOptionValue;

        // -----------------------------------------------------
        // No page selected
        // -----------------------------------------------------

        if (!selectedPage) {

            await storeValue(
                "MMS_SELECTED_OCR_PAGE",
                ""
            );

            return;
        }

        // -----------------------------------------------------
        // Get OCR pages
        // -----------------------------------------------------

        const pages =
            MMS_DOCUMENT_OCR_PAGES.data || [];

        // -----------------------------------------------------
        // Find selected page
        // -----------------------------------------------------

        const page =
            pages.find(
                x =>
                    String(x.OCR_PAGE_ID) ===
                    String(selectedPage)
            );

        // -----------------------------------------------------
        // Page not found
        // -----------------------------------------------------

        if (!page) {

            await storeValue(
                "MMS_SELECTED_OCR_PAGE",
                ""
            );

            showAlert(
                "Selected OCR page was not found",
                "warning"
            );

            return;
        }

        // -----------------------------------------------------
        // Store PAGE ID only
        // -----------------------------------------------------

        await storeValue(
            "MMS_SELECTED_OCR_PAGE",
            String(page.OCR_PAGE_ID)
        );
    },

    // =========================================================
    // GET OCR TEXT HTML
    // =========================================================

    getOCRTextHTML: () => {

        const selectedPageID =
            appsmith.store.MMS_SELECTED_OCR_PAGE;

        // -----------------------------------------------------
        // No page selected
        // -----------------------------------------------------

        if (!selectedPageID) {

            return `
                <div style="
                    font-family: Arial, Tahoma, sans-serif;
                    padding: 30px;
                    text-align: center;
                    color: #777;
                ">
                    Please select a page.
                </div>
            `;
        }

        // -----------------------------------------------------
        // Get OCR pages
        // -----------------------------------------------------

        const pages =
            MMS_DOCUMENT_OCR_PAGES.data || [];

        // -----------------------------------------------------
        // Find selected page
        // -----------------------------------------------------

        const page =
            pages.find(
                p =>
                    String(p.OCR_PAGE_ID) ===
                    String(selectedPageID)
            );

        // -----------------------------------------------------
        // Page not found
        // -----------------------------------------------------

        if (!page) {

            return `
                <div style="
                    font-family: Arial, Tahoma, sans-serif;
                    padding: 30px;
                    text-align: center;
                    color: #777;
                ">
                    OCR data is not available
                    for the selected page.
                </div>
            `;
        }

        // -----------------------------------------------------
        // Confidence
        // -----------------------------------------------------

        const confidence =
            page.AVG_CONFIDENCE != null
                ? (
                    Number(page.AVG_CONFIDENCE) * 100
                ).toFixed(2)
                : "N/A";

        // -----------------------------------------------------
        // Engine
        // -----------------------------------------------------

        const engine =
            page.OCR_ENGINE || "N/A";

        // -----------------------------------------------------
        // Status
        // -----------------------------------------------------

        const status =
            page.STATUS || "N/A";

        // -----------------------------------------------------
        // OCR TEXT
        // -----------------------------------------------------
        // Normalize Arabic/Persian digits for display.
        // The original OCR_TEXT in Oracle is NOT changed.
        // -----------------------------------------------------

        const ocrText =
            page.OCR_TEXT
                ? JS_Document.normalizeDigits(
                    page.OCR_TEXT
                )
                : "No OCR text available.";

        // -----------------------------------------------------
        // Return HTML
        // -----------------------------------------------------

        return `
            <div style="
                font-family: Arial, Tahoma, sans-serif;
                margin-bottom: 12px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            ">

                <strong>
                    Page ${page.PAGE_NUMBER}
                </strong>

                <span style="margin-left:20px;">
                    Status: ${status}
                </span>

                <span style="margin-left:20px;">
                    Confidence: ${confidence}%
                </span>

                <span style="margin-left:20px;">
                    Engine: ${engine}
                </span>

            </div>

            <div dir="rtl" style="
                direction: rtl;
                text-align: right;
                white-space: pre-wrap;
                font-family: Arial, Tahoma, sans-serif;
                font-size: 16px;
                line-height: 2;
                overflow-wrap: anywhere;
                padding: 10px;
            ">
                ${ocrText}
            </div>
        `;
    }

};