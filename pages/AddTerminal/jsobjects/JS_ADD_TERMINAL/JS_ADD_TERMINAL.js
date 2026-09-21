export default {

	//--------------------------------------------------------------
	// Request ID
	//--------------------------------------------------------------
	getRequestId: () => {

		return (
			appsmith.store.MMS_ADD_TERMINAL_REQUEST_ID ||
			appsmith.URL.queryParams.requestId ||
			""
		);
	},


	//--------------------------------------------------------------
	// Page Mode
	//
	// NEW  = no request exists
	// EDIT = request already exists
	//--------------------------------------------------------------
	getPageMode: () => {

		return JS_ADD_TERMINAL.getRequestId()
			? "EDIT"
		: "NEW";

	},


	//--------------------------------------------------------------
	// Request Status
	//--------------------------------------------------------------
	getRequestStatus: () => {

		return (			qry_created_request.data?.[0].STATUS ||			""		);

	},


	//--------------------------------------------------------------
	// Is Draft
	//
	// NEW page has no request yet, so it is editable.
	// Existing request is editable only when ST-DRAFT.
	//--------------------------------------------------------------
	isDraft: () => {

		return (
			JS_ADD_TERMINAL.getPageMode() === "NEW" ||
			JS_ADD_TERMINAL.getRequestStatus() === "ST-DRAFT"
		);

	},


	//--------------------------------------------------------------
	// Can Edit Request Fields
	//
	// Request Date
	// RM
	// Team Leader
	// RMS Oracle
	// Request Comment
	//--------------------------------------------------------------
	canEditRequest: () => {

		return JS_ADD_TERMINAL.isDraft();

	},


	//--------------------------------------------------------------
	// Can Edit Merchant / Original Contract
	//
	// These fields are editable only before the request exists.
	//--------------------------------------------------------------
	canEditSource: () => {

		return JS_ADD_TERMINAL.getPageMode() === "NEW";

	},


	//--------------------------------------------------------------
	// Can Edit Terminals
	//--------------------------------------------------------------
	canEditTerminals: () => {

		return (
			JS_ADD_TERMINAL.isDraft() &&
			JS_ADD_TERMINAL.isTerminalSectionEnabled()
		);

	},


	//--------------------------------------------------------------
	// Can Save Draft
	//--------------------------------------------------------------
	canSaveDraft: () => {

		return JS_ADD_TERMINAL.isDraft();

	},


	//--------------------------------------------------------------
	// Can Submit
	//--------------------------------------------------------------
	canSubmit: () => {

		return (
			JS_ADD_TERMINAL.getRequestStatus() === "ST-DRAFT" &&
			JS_ADD_TERMINAL.isTerminalSectionEnabled()
		);

	},


	//--------------------------------------------------------------
	// Base / Original Contract
	//
	// Contract is read from the source/request data.
	// This is informational only.
	//
	// Oracle remains responsible for generating the Add Terminal
	// contract serial.
	//--------------------------------------------------------------
	getBaseContract: () => {

		const contractSerial =
					qry_created_request.data?.[0]?.CONTRACT_SERIAL || "";

		return contractSerial.replace(/-\d+$/, "");

	},


	//--------------------------------------------------------------
	// Initialize Page
	//--------------------------------------------------------------
	initializeRequest: async () => {

		const urlRequestId =
					appsmith.URL.queryParams.requestId || "";


		//----------------------------------------------------------
		// EDIT MODE
		//----------------------------------------------------------
		if (urlRequestId) {

			await storeValue(
				"MMS_ADD_TERMINAL_REQUEST_ID",
				urlRequestId
			);

			await storeValue(
				"MMS_ADD_TERMINAL_REQUEST_CREATED",
				true
			);

			await storeValue(
				"MMS_ADD_TERMINAL_PAGE_MODE",
				"EDIT"
			);


			//------------------------------------------------------
			// Load existing request
			//------------------------------------------------------
			await qry_created_request.run();


			//------------------------------------------------------
			// Load terminals belonging to this request
			//------------------------------------------------------
			await QRY_ADD_TERMINAL_LIST.run();


			//------------------------------------------------------
			// Load merchants / original contracts
			//------------------------------------------------------
			await QRY_Merchant_REQUEST.run();


			return {

				success: true,

				mode: "EDIT",

				requestId: urlRequestId

			};

		}


		//----------------------------------------------------------
		// NEW MODE
		//----------------------------------------------------------

		await storeValue(
			"MMS_ADD_TERMINAL_REQUEST_ID",
			""
		);

		await storeValue(
			"MMS_ADD_TERMINAL_REQUEST_CREATED",
			false
		);

		await storeValue(
			"MMS_ADD_TERMINAL_PAGE_MODE",
			"NEW"
		);


		return {

			success: true,

			mode: "NEW",

			requestId: ""

		};

	},


	//--------------------------------------------------------------
	// Generate New REQUEST_ID
	//
	// Appsmith generates only the request identity.
	// Oracle generates CONTRACT_SERIAL.
	//--------------------------------------------------------------
	generateRequestId: async () => {

		const requestId =
					crypto
		.randomUUID()
		.replace(/-/g, "")
		.toUpperCase();


		await storeValue(
			"MMS_ADD_TERMINAL_REQUEST_ID",
			requestId
		);


		return requestId;

	},


	//--------------------------------------------------------------
	// Merchant
	//--------------------------------------------------------------
	getMerchantId: () => {

		return (
			iMerchant.selectedOptionValue ||
			""
		);

	},


	//--------------------------------------------------------------
	// Original / Source Request
	//--------------------------------------------------------------
	getSourceRequestId: () => {

		return (
			iMerchantContract.selectedOptionValue ||
			""
		);

	},


	//--------------------------------------------------------------
	// Request Data
	//
	// IMPORTANT:
	// No contractSerial is sent.
	//
	// Oracle generates the Add Terminal contract serial.
	//--------------------------------------------------------------
	getRequestData: () => {

		return {

			contractSerial:iContractSeriel.text,
			merchantId:
			JS_ADD_TERMINAL.getMerchantId(),

			sourceRequestId:
			JS_ADD_TERMINAL.getSourceRequestId(),

			requestDate:
			iRequestDate.selectedDate
			? iRequestDate.selectedDate
			: new Date().toISOString(),


			//------------------------------------------------------
			// Request-level assignments
			//------------------------------------------------------
			rmId:
			iRMS.selectedOptionValue || "",

			teamLeaderId:
			iTeamLeader.selectedOptionValue || "",

			rmsOracleId:
			iRM_Oracle_CODE.selectedOptionValue || "",


			//------------------------------------------------------
			// Maker
			//------------------------------------------------------
			makerId:
			appsmith.user.username,


			//------------------------------------------------------
			// Request Comment
			//------------------------------------------------------
			requestComment:
			iRequestComment.text || ""

		};

	},


	//--------------------------------------------------------------
	// Validate Save
	//--------------------------------------------------------------
	validateContinue: () => {

		const merchantId =
					JS_ADD_TERMINAL.getMerchantId();

		const sourceRequestId =
					JS_ADD_TERMINAL.getSourceRequestId();


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
	// Save Add Terminal Draft
	//
	// SINGLE ENTRY POINT
	//
	// NEW REQUEST:
	//     Generate REQUEST_ID
	//     SAVE_ADD_TERMINAL_REQUEST
	//         -> CREATE_ADD_TERMINAL_REQUEST
	//
	// EXISTING REQUEST:
	//     SAVE_ADD_TERMINAL_REQUEST
	//         -> UPDATE_ADD_TERMINAL_DRAFT
	//
	// Oracle decides CREATE vs UPDATE.
	//--------------------------------------------------------------
	saveDraft: async () => {

		try {

			let requestId =
					JS_ADD_TERMINAL.getRequestId();


			//------------------------------------------------------
			// NEW REQUEST
			//------------------------------------------------------
			if (!requestId) {

				//--------------------------------------------------
				// Validate
				//--------------------------------------------------
				if (
					!JS_ADD_TERMINAL.validateContinue()
				) {

					return {

						success: false,

						validationFailed: true

					};

				}


				//--------------------------------------------------
				// Generate REQUEST_ID
				//--------------------------------------------------
				requestId =
					await JS_ADD_TERMINAL.generateRequestId();


				if (!requestId) {

					throw new Error(
						"Request ID was not generated"
					);

				}

			}


			//------------------------------------------------------
			// EXISTING REQUEST
			//
			// Validate only if request already exists.
			//------------------------------------------------------
			else {

				if (
					JS_ADD_TERMINAL.getRequestStatus() !==
					"ST-DRAFT"
				) {

					showAlert(
						"Only draft Add Terminal requests can be saved",
						"warning"
					);

					return {

						success: false,

						validationFailed: true

					};

				}

			}


			//------------------------------------------------------
			// SINGLE DATABASE SAVE ENTRY POINT
			//
			// New:
			//     CREATE_ADD_TERMINAL_REQUEST
			//
			// Existing:
			//     UPDATE_ADD_TERMINAL_DRAFT
			//------------------------------------------------------
			await Save_request.run();


			//------------------------------------------------------
			// Mark request as created
			//------------------------------------------------------
			await storeValue(
				"MMS_ADD_TERMINAL_REQUEST_CREATED",
				true
			);


			//------------------------------------------------------
			// Page becomes EDIT mode
			//------------------------------------------------------
			await storeValue(
				"MMS_ADD_TERMINAL_PAGE_MODE",
				"EDIT"
			);


			//------------------------------------------------------
			// Refresh request
			//------------------------------------------------------
			await qry_created_request.run();


			//------------------------------------------------------
			// Refresh terminals
			//------------------------------------------------------
			await QRY_ADD_TERMINAL_LIST.run();


			//------------------------------------------------------
			// Reset terminal form
			//------------------------------------------------------
			resetWidget(
				"frmTerminal"
			);


			//------------------------------------------------------
			// Success
			//------------------------------------------------------
			showAlert(
				"Add Terminal request saved as draft",
				"success"
			);


			return {

				success: true,

				requestId: requestId

			};

		} catch (error) {

			console.log(
				"Save Add Terminal draft failed:",
				error
			);


			//------------------------------------------------------
			// IMPORTANT:
			// Do NOT clear REQUEST_ID.
			//
			// The request may already exist in Oracle.
			//------------------------------------------------------

			showAlert(
				error?.message ||
				"Failed to save Add Terminal draft",
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
	// Terminal Section Visibility
	//--------------------------------------------------------------
	isTerminalSectionEnabled: () => {

		return (

			appsmith.store.MMS_ADD_TERMINAL_REQUEST_CREATED === true

			&&

			!!JS_ADD_TERMINAL.getRequestId()

		);

	},


	//--------------------------------------------------------------
	// Save Button Visibility
	//
	// Save is available in both NEW and EDIT draft modes.
	//--------------------------------------------------------------
	isContinueVisible: () => {

		return JS_ADD_TERMINAL.isDraft();

	},


	//--------------------------------------------------------------
	// Submit Add Terminal Request
	//--------------------------------------------------------------
	submitRequest: async () => {

		try {

			//------------------------------------------------------
			// Request ID
			//------------------------------------------------------
			const requestId =
						JS_ADD_TERMINAL.getRequestId();


			if (!requestId) {

				showAlert(
					"Add Terminal request ID is missing",
					"error"
				);

				return {

					success: false,

					validationFailed: true

				};

			}


			//------------------------------------------------------
			// Request must exist
			//------------------------------------------------------
			if (
				appsmith.store.MMS_ADD_TERMINAL_REQUEST_CREATED
				!== true
			) {

				showAlert(
					"Please save the Add Terminal request first",
					"warning"
				);

				return {

					success: false,

					validationFailed: true

				};

			}


			//------------------------------------------------------
			// Only ST-DRAFT can be submitted
			//------------------------------------------------------
			if (
				JS_ADD_TERMINAL.getRequestStatus() !==
				"ST-DRAFT"
			) {

				showAlert(
					"Only draft Add Terminal requests can be submitted",
					"warning"
				);

				return {

					success: false,

					validationFailed: true

				};

			}


			//------------------------------------------------------
			// Terminal section must be enabled
			//------------------------------------------------------
			if (
				!JS_ADD_TERMINAL.isTerminalSectionEnabled()
			) {

				showAlert(
					"Please save the Add Terminal request first",
					"warning"
				);

				return {

					success: false,

					validationFailed: true

				};

			}


			//------------------------------------------------------
			// Submit
			//------------------------------------------------------
			await SUBMIT_TERMINALS.run();


			//------------------------------------------------------
			// Refresh request
			//------------------------------------------------------
			await qry_created_request.run();


			//------------------------------------------------------
			// Refresh terminals
			//------------------------------------------------------
			await QRY_ADD_TERMINAL_LIST.run();


			//------------------------------------------------------
			// Success
			//------------------------------------------------------
			showAlert(
				"Add Terminal request submitted successfully",
				"success"
			);


			return {

				success: true,

				requestId:
				requestId

			};

		} catch (error) {

			console.log(
				"Submit Add Terminal request failed:",
				error
			);


			showAlert(
				error?.message ||
				"Failed to submit Add Terminal request",
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