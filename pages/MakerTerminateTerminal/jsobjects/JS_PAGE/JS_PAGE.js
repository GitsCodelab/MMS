export default {
	//--------------------------------------------------------------
	// Request ID
	//--------------------------------------------------------------
	getRequestId: () => {
		const urlRequestId =
					appsmith.URL.queryParams.requestId ||
					appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_ID ||
					"";

		return urlRequestId || "";
	},
	getBaseContract: () => {

		const contractSerial =
					qry_created_request.data?.[0]?.CONTRACT_SERIAL || "";

		return contractSerial.replace(/-\d+$/, "");

	},
	//--------------------------------------------------------------
	// Page Mode
	//
	// NEW  = creating a new Replace Terminal request
	// EDIT = editing an existing draft request
	//--------------------------------------------------------------
	getPageMode: () => {
		return appsmith.store.MMS_REPLACE_TERMINAL_PAGE_MODE || "NEW";
	},

	//--------------------------------------------------------------
	// Request Status
	//--------------------------------------------------------------
	getRequestStatus: () => {
		return qry_created_request.data?.[0]?.STATUS_CODE || "ST-DRAFT";
	},

	//--------------------------------------------------------------
	// Is Draft
	//
	// NEW page is considered editable before request creation.
	// Existing request is editable only when DB status is ST-DRAFT.
	//--------------------------------------------------------------
	isDraft: () => {
		const pageMode = JS_PAGE.getPageMode();

		const status = JS_PAGE.getRequestStatus();

		const requestCreated =
					appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_CREATED === true;

		// New request has not been created yet
		if (pageMode === "NEW") {
			return true;
		}

		// Existing request must explicitly be ST-DRAFT
		return pageMode === "EDIT" && requestCreated && status === "DRAFT";
	},

	//--------------------------------------------------------------
	// Can Edit Request Fields
	//--------------------------------------------------------------
	canEditRequest: () => {
		return JS_PAGE.isDraft();
	},

	//--------------------------------------------------------------
	// Can Edit Merchant / Original Contract / Old Terminal
	//
	// These are source fields and can only be selected
	// before the Replace request is created.
	//--------------------------------------------------------------
	canEditSource: () => {
		return JS_PAGE.getPageMode() === "NEW";
	},

	//--------------------------------------------------------------
	// Can Edit New Terminal
	//
	// New terminal can be entered after request creation
	// while request remains ST-DRAFT.
	//--------------------------------------------------------------
	canEditTerminals: () => {
		return (
			JS_PAGE.isDraft() &&
			JS_PAGE.isTerminalSectionEnabled()
		);
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
			JS_PAGE.getPageMode() ==="EDIT"
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
	// Existing LIVE Terminal
	//--------------------------------------------------------------
	getOldTerminalId: () => {
		return iOldTerminal.selectedOptionValue || "";
	},

	//--------------------------------------------------------------
	// Request Data
	//
	// contractSerial is intentionally NOT sent.
	// Oracle generates it centrally.
	//--------------------------------------------------------------
	getRequestData: () => {
		return {
			merchantId: JS_PAGE.getMerchantId(),
			
			sourceRequestId: JS_PAGE.getSourceRequestId(),
			oldTerminalId: JS_PAGE.getOldTerminalId(),

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

		const oldTerminalId = JS_PAGE.getOldTerminalId();

		//----------------------------------------------------------
		// Merchant
		//----------------------------------------------------------
		if (!merchantId) {
			showAlert("Please select a merchant", "warning");

			return false;
		}

		//----------------------------------------------------------
		// Original Contract
		//----------------------------------------------------------
		if (!sourceRequestId) {
			showAlert("Please select the original contract", "warning");

			return false;
		}

		//----------------------------------------------------------
		// Existing LIVE Terminal
		//----------------------------------------------------------
		if (!oldTerminalId) {
			showAlert("Please select the terminal to replace", "warning");

			return false;
		}

		//----------------------------------------------------------
		// Maker
		//----------------------------------------------------------
		if (!appsmith.user.username) {
			showAlert("Maker ID is missing", "error");

			return false;
		}

		return true;
	},

	//--------------------------------------------------------------
	// Generate New REQUEST_ID
	//--------------------------------------------------------------
	generateRequestId: async () => {
		const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase();

		await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", requestId);

		return requestId;
	},

	//--------------------------------------------------------------
	// Initialize Page
	//
	// THIS FUNCTION IS CALLED FROM PAGE LOAD.
	//
	// URL requestId exists -> EDIT
	// No URL requestId     -> NEW
	//--------------------------------------------------------------
	initializeRequest: async () => {
		if (appsmith.store.MMS_REPLACE_TERMINAL_PAGE_MODE != "NEW") {
			const urlRequestId = appsmith.URL.queryParams.requestId || "";

			//==========================================================
			// EXISTING REQUEST
			//==========================================================
			if (urlRequestId) {
				await storeValue("MMS_REPLACE_TERMINAL_PAGE_MODE", "EDIT");

				await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", urlRequestId);

				await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", true);

				await qry_created_request.run();
				await Base_Requests.run();
				return {
					success: true,
					mode: "EDIT",
					requestId: urlRequestId,
				};
			}
		} else {
			//new

			const requestId = await JS_PAGE.generateRequestId();
			await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", requestId);

			//==========================================================
			// NEW REQUEST
			//==========================================================

			await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", false);

			return {
				success: true,
				mode: "NEW",
				requestId: "",
			};
		}
	},

	//--------------------------------------------------------------
	// Save / Create / Update Replace Request
	//--------------------------------------------------------------

	saveDraft: async () => {
  try {

    const requestId = JS_PAGE.getRequestId();

    if (!requestId) {
      showAlert("Request ID is missing", "error");
      return { success: false };
    }

    await Save_Request.run();

    await storeValue(
      "MMS_TERMINATE_TERMINAL_PAGE_MODE",
      "EDIT"
    );

    await storeValue(
      "MMS_TERMINATE_TERMINAL_REQUEST_CREATED",
      true
    );

    await qry_created_request.run();

			await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", true);

			await storeValue("MMS_REPLACE_TERMINAL_PAGE_MODE", "EDIT");
    showAlert(
      "Terminate Terminal request saved successfully",
      "success"
    );

    return {
      success: true,
      requestId
    };

  } catch (error) {

    console.log(
      "Save Terminate Terminal failed:",
      error
    );

    showAlert(
      error?.message || "Failed to save request",
      "error"
    );

    return {
      success: false,
      error: error?.message || String(error)
    };
  }
},

	//--------------------------------------------------------------
	// Terminal Section
	//--------------------------------------------------------------
	isTerminalSectionEnabled: () => {
		return (
			appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_CREATED === true &&
			!!JS_PAGE.getRequestId()
		);
	},

	//--------------------------------------------------------------
	// Save Draft Button Visibility
	//--------------------------------------------------------------
	isContinueVisible: () => {
		return JS_PAGE.isDraft();
	},

	//--------------------------------------------------------------
	// Submit Replace Terminal Request
	//--------------------------------------------------------------
	submitRequest: async () => {
  try {

    const requestId = JS_PAGE.getRequestId();

    if (!requestId) {
      showAlert("Request ID is missing", "error");
      return { success: false };
    }

    if (JS_PAGE.getPageMode() !== "EDIT") {
      showAlert("Please save the request before submitting", "warning");
      return { success: false };
    }

    if (JS_PAGE.getRequestStatus() !== "ST-DRAFT") {
      showAlert("Only Draft requests can be submitted", "warning");
      return { success: false };
    }

    if (!JS_PAGE.isTerminalSectionEnabled()) {
      showAlert("Please select a terminal", "warning");
      return { success: false };
    }

    await Submit_request.run();

    await qry_created_request.run();

    showAlert(
      "Terminate Terminal request submitted successfully",
      "success"
    );

    return {
      success: true,
      requestId
    };

  } catch (error) {

    console.log(
      "Submit Terminate Terminal failed:",
      error
    );

    showAlert(
      error?.message || "Failed to submit request",
      "error"
    );

    return {
      success: false,
      error: error?.message || String(error)
    };
  }
},
};
