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
	// NEW  = page opened without requestId
	// EDIT = page opened with requestId
	//--------------------------------------------------------------
	getPageMode: () => {

		const requestId =
			appsmith.URL.queryParams.requestId || "";

		return requestId
			? "EDIT"
			: "NEW";
	},


	//--------------------------------------------------------------
	// Request Status
	//--------------------------------------------------------------
	getRequestStatus: () => {

		return (
			qry_created_request.data?.[0]?.STATUS_CODE ||
			""
		);
	},


	//--------------------------------------------------------------
	// Is Draft
	//
	// NEW page has no request yet, so it is treated as editable.
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
		// Existing Add Terminal request opened from Workplace
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
showAlert("loaded");

			return {

				success: true,

				mode: "EDIT",

				requestId: urlRequestId

			};
		}


		//----------------------------------------------------------
		// NEW MODE
		// No request exists yet
		//----------------------------------------------------------

		await storeValue(
			"MMS_ADD_TERMINAL_REQUEST_ID",
			""
		);

		await storeValue(
			"MMS_ADD_TERMINAL_REQUEST_CREATED",
			false
		);


		return {

			success: true,

			mode: "NEW",

			requestId: ""

		};
	},


	//--------------------------------------------------------------
	// Generate New REQUEST_ID
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
	//--------------------------------------------------------------
	getCreateRequestData: () => {

		return {

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
	// Validate Save Draft
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
	// NEW REQUEST:
	//     Create request
	//
	// EXISTING REQUEST:
	//     Update same draft
	//--------------------------------------------------------------
	saveDraft: async () => {

		try {

			const requestId =
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
				const newRequestId =
					await JS_ADD_TERMINAL.generateRequestId();


				if (!newRequestId) {

					throw new Error(
						"Request ID was not generated"
					);

				}


				//--------------------------------------------------
				// Create NEW_TERMINAL request
				//--------------------------------------------------
				await CREATE_ADD_TERMINAL_REQUES.run();


				//--------------------------------------------------
				// Mark request as created
				//--------------------------------------------------
				await storeValue(
					"MMS_ADD_TERMINAL_REQUEST_CREATED",
					true
				);


				//--------------------------------------------------
				// Refresh request information
				//--------------------------------------------------
				await qry_created_request.run();


				//--------------------------------------------------
				// Refresh terminals
				//--------------------------------------------------
				await QRY_ADD_TERMINAL_LIST.run();


				//--------------------------------------------------
				// Reset terminal form
				//--------------------------------------------------
				resetWidget(
					"frmTerminal"
				);


				//--------------------------------------------------
				// Success
				//--------------------------------------------------
				showAlert(
					"Add Terminal request saved as draft",
					"success"
				);


				return {

					success: true,

					mode: "CREATE",

					requestId:
						newRequestId

				};

			}


			//------------------------------------------------------
			// EXISTING REQUEST
			// Save changes to the same draft
			//------------------------------------------------------

			//------------------------------------------------------
			// Save changes
			//------------------------------------------------------
			await QRY_UPDATE_ADD_TERMINAL_DRAFT.run();


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
				"Draft changes saved successfully",
				"success"
			);


			return {

				success: true,

				mode: "UPDATE",

				requestId:
					requestId

			};

		} catch (error) {

			console.log(
				"Save Add Terminal draft failed:",
				error
			);


			//------------------------------------------------------
			// IMPORTANT:
			// Do NOT clear the existing request ID here.
			//
			// If UPDATE fails, the draft still exists.
			// We must keep the request ID so the user can retry.
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
	// Save Draft Button Visibility
	//--------------------------------------------------------------
	isContinueVisible: () => {

		return true;

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