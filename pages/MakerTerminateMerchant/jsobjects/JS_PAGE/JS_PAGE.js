export default {

	//--------------------------------------------------------------
	// Request ID
	//--------------------------------------------------------------
	getRequestId: () => {
		const urlRequestId =
			appsmith.URL.queryParams.requestId ||
			appsmith.store.MMS_TERMINATE_MERCHANT_REQUEST_ID ||
			"";

		return urlRequestId || "";
	},

	//--------------------------------------------------------------
	// Page Mode
	//
	// NEW  = creating a new Terminate Merchant request
	// EDIT = editing an existing draft request
	//--------------------------------------------------------------
	getPageMode: () => {
		return appsmith.store.MMS_TERMINATE_MERCHANT_PAGE_MODE || "NEW";
	},

	//--------------------------------------------------------------
	// Request Status
	//--------------------------------------------------------------
	getRequestStatus: () => {
		return qry_created_request.data?.[0]?.STATUS_CODE || "ST-DRAFT";
	},

	//--------------------------------------------------------------
	// Is Draft
	//--------------------------------------------------------------
	isDraft: () => {

		const pageMode = JS_PAGE.getPageMode();
		const status = JS_PAGE.getRequestStatus();

		const requestCreated =
			appsmith.store.MMS_TERMINATE_MERCHANT_REQUEST_CREATED === true;

		// New request is editable
		if (pageMode === "NEW") {
			return true;
		}

		// Existing request is editable only when it is Draft
		return (
			pageMode === "EDIT" &&
			requestCreated &&
			status === "ST-DRAFT"
		);
	},

	//--------------------------------------------------------------
	// Can Edit Request Fields
	//--------------------------------------------------------------
	canEditRequest: () => {
		return JS_PAGE.isDraft();
	},

	//--------------------------------------------------------------
	// Can Edit Merchant / Original Contract
	//
	// Source fields can only be selected before request creation.
	//--------------------------------------------------------------
	canEditSource: () => {
		return JS_PAGE.getPageMode() === "NEW";
	},

	//--------------------------------------------------------------
	// Can Save Draft
	//--------------------------------------------------------------
	canSaveDraft: () => {
		return JS_PAGE.isDraft();
	},

	//--------------------------------------------------------------
	// Can Submit
	//--------------------------------------------------------------
	canSubmit: () => {
		return (
			JS_PAGE.getPageMode() === "EDIT" &&
			JS_PAGE.getRequestStatus() === "ST-DRAFT"
		);
	},

	//--------------------------------------------------------------
	// Merchant
	//--------------------------------------------------------------
	getMerchantId: () => {
		return iMerchant.selectedOptionValue || "";
	},

	//--------------------------------------------------------------
	// Original / Source Request
	//--------------------------------------------------------------
	getSourceRequestId: () => {
		return iMerchantContract.selectedOptionValue || "";
	},

	//--------------------------------------------------------------
	// Request Data
	//
	// contractSerial is intentionally NOT sent.
	// Oracle generates it centrally.
	//
	// oldTerminalId is NOT applicable for Terminate Merchant.
	//--------------------------------------------------------------
	getRequestData: () => {
		return {
			merchantId: JS_PAGE.getMerchantId(),

			sourceRequestId: JS_PAGE.getSourceRequestId(),

			requestDate: iRequestDate.selectedDate
				? iRequestDate.selectedDate
				: new Date().toISOString(),

			rmId: iRMS.selectedOptionValue || "",
			teamLeaderId: iTeamLeader.selectedOptionValue || "",
			rmsOracleId: iRM_Oracle_CODE.selectedOptionValue || "",

			makerId: appsmith.user.username,

			requestComment: iRequestComment.text || ""
		};
	},

	//--------------------------------------------------------------
	// Validate Create Request
	//--------------------------------------------------------------
	validateContinue: () => {

		const merchantId = JS_PAGE.getMerchantId();

		const sourceRequestId = JS_PAGE.getSourceRequestId();

		//----------------------------------------------------------
		// Merchant
		//----------------------------------------------------------
		if (!merchantId) {
			showAlert(
				"Please select a merchant",
				"warning"
			);

			return false;
		}

		//----------------------------------------------------------
		// Original Contract
		//----------------------------------------------------------
		if (!sourceRequestId) {
			showAlert(
				"Please select the original contract",
				"warning"
			);

			return false;
		}

		//----------------------------------------------------------
		// Maker
		//----------------------------------------------------------
		if (!appsmith.user.username) {
			showAlert(
				"Maker ID is missing",
				"error"
			);

			return false;
		}

		return true;
	},

	//--------------------------------------------------------------
	// Generate New REQUEST_ID
	//--------------------------------------------------------------
	generateRequestId: async () => {

		const requestId =
			crypto.randomUUID()
				.replace(/-/g, "")
				.toUpperCase();

		await storeValue(
			"MMS_TERMINATE_MERCHANT_REQUEST_ID",
			requestId
		);

		return requestId;
	},

	//--------------------------------------------------------------
	// Initialize Page
	//
	// URL requestId exists -> EDIT
	// No URL requestId     -> NEW
	//--------------------------------------------------------------
	initializeRequest: async () => {

		const urlRequestId =
			appsmith.URL.queryParams.requestId || "";

		//----------------------------------------------------------
		// EXISTING REQUEST
		//----------------------------------------------------------
		if (urlRequestId) {

			await storeValue(
				"MMS_TERMINATE_MERCHANT_PAGE_MODE",
				"EDIT"
			);

			await storeValue(
				"MMS_TERMINATE_MERCHANT_REQUEST_ID",
				urlRequestId
			);

			await storeValue(
				"MMS_TERMINATE_MERCHANT_REQUEST_CREATED",
				true
			);

			await qry_created_request.run();
			await Base_Requests.run();

			return {
				success: true,
				mode: "EDIT",
				requestId: urlRequestId
			};
		}

		//----------------------------------------------------------
		// NEW REQUEST
		//----------------------------------------------------------

		await storeValue(
			"MMS_TERMINATE_MERCHANT_PAGE_MODE",
			"NEW"
		);

		await storeValue(
			"MMS_TERMINATE_MERCHANT_REQUEST_CREATED",
			false
		);

		const requestId =
			await JS_PAGE.generateRequestId();

		return {
			success: true,
			mode: "NEW",
			requestId
		};
	},

	//--------------------------------------------------------------
	// Save / Create / Update Terminate Merchant Request
	//--------------------------------------------------------------
	saveDraft: async () => {

		try {

			const requestId =
				JS_PAGE.getRequestId();

			if (!requestId) {

				showAlert(
					"Request ID is missing",
					"error"
				);

				return {
					success: false
				};
			}

			await Save_Request.run();

			await storeValue(
				"MMS_TERMINATE_MERCHANT_REQUEST_CREATED",
				true
			);

			await storeValue(
				"MMS_TERMINATE_MERCHANT_PAGE_MODE",
				"EDIT"
			);

			await qry_created_request.run();

			showAlert(
				"Terminate Merchant request saved successfully",
				"success"
			);

			return {
				success: true,
				requestId
			};

		} catch (error) {

			console.log(
				"Save Terminate Merchant failed:",
				error
			);

			showAlert(
				error?.message ||
				"Failed to save request",
				"error"
			);

			return {
				success: false,
				error:
					error?.message ||
					String(error)
			};
		}
	},

	//--------------------------------------------------------------
	// No Terminal Section
	//
	// Terminate Merchant does not select a terminal.
	//--------------------------------------------------------------
	isTerminalSectionEnabled: () => {
		return false;
	},

	//--------------------------------------------------------------
	// Save Draft Button Visibility
	//--------------------------------------------------------------
	isContinueVisible: () => {
		return JS_PAGE.isDraft();
	},

	//--------------------------------------------------------------
	// Submit Terminate Merchant Request
	//--------------------------------------------------------------
	submitRequest: async () => {

		try {

			const requestId =
				JS_PAGE.getRequestId();

			if (!requestId) {

				showAlert(
					"Request ID is missing",
					"error"
				);

				return {
					success: false
				};
			}

			if (
				JS_PAGE.getPageMode() !== "EDIT"
			) {

				showAlert(
					"Please save the request before submitting",
					"warning"
				);

				return {
					success: false
				};
			}

			if (
				JS_PAGE.getRequestStatus() !== "ST-DRAFT"
			) {

				showAlert(
					"Only Draft requests can be submitted",
					"warning"
				);

				return {
					success: false
				};
			}

			await Submit_request.run();

			await qry_created_request.run();

			showAlert(
				"Terminate Merchant request submitted successfully",
				"success"
			);

			return {
				success: true,
				requestId
			};

		} catch (error) {

			console.log(
				"Submit Terminate Merchant failed:",
				error
			);

			showAlert(
				error?.message ||
				"Failed to submit request",
				"error"
			);

			return {
				success: false,
				error:
					error?.message ||
					String(error)
			};
		}
	}
};