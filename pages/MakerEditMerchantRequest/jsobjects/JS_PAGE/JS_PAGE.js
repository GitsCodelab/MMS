export default {

	// ============================================================
	// REQUEST ID
	// ============================================================

	getRequestId: () => {
		return appsmith.URL.queryParams.requestId || "";
	},


	// ============================================================
	// PAGE MODE
	// ============================================================

	getPageMode: () => {
		return JS_PAGE.getRequestId()
			? "EDIT"
			: "NEW";
	},


	// ============================================================
	// REQUEST STATUS
	// ============================================================

	getRequestStatus: () => {
		return MMS_MERCHANT_REQUEST.data?.[0]?.STATUS_CODE || "";
	},


	// ============================================================
	// REQUEST STATE
	// ============================================================

	isDraft: () => {
		return (
			JS_PAGE.getPageMode() === "NEW" ||
			JS_PAGE.getRequestStatus() === "ST-DRAFT"
		);
	},


	// ============================================================
	// EDIT / SAVE PERMISSIONS
	// ============================================================

	canEditRequest: () => {
		return JS_PAGE.isDraft();
	},

	canSaveDraft: () => {
		return JS_PAGE.isDraft();
	},


	// ============================================================
	// SUBMIT PERMISSION
	// ============================================================

	canSubmit: () => {
		return (
			JS_PAGE.getPageMode() === "EDIT" &&
			JS_PAGE.getRequestStatus() === "ST-DRAFT"
		);
	},


	// ============================================================
	// REQUEST DATA
	// ============================================================

	getRequestData: () => {

		return {

			requestTypeId: 1,

			contractSerial: iContractSerial.text,

			requestDate:
				MMS_MERCHANT_REQUEST.data?.[0]?.REQUEST_DATE || null,

			cif: iCIF.text,

			nationalId:
				String(iNationalID.text || ""),

			ownerNameAr:
				iOwnerName.text,

			companyName:
				iCompanyName.text,

			companyNameAr:
				iCompanyNameAR.text,

			merchantNameEn:
				iMerchantNameEN.text,

			merchantNameAr:
				iMerchantNameAR.text,

			contactNameAr:
				iContactName.text?.text || "",

			mobilePrimary:
				iMobilePrumary.text,

			addressEn:
				iAddressEN.text,

			addressAr:
				iAddressAR.text,

			city:
				iCity.text,

			region:
				iRegion.text,

			branchCode:
				iBranch.selectedOptionValue,

			teamLeader:
				iTeamLeader.selectedOptionValue,

			rmOracleCode:
				iRM_Oracle_CODE.selectedOptionValue,

			bankAccount:
				iBankAccount.text,

			mccId:
				iMCC.selectedOptionValue,

			packageId:
				iPackage.selectedOptionValue,

			contractMdr:
				iContractMDR.text
					? Number(iContractMDR.text)
					: null,

			contractMdrValue:
				iContractMDRValue.text
					? Number(iContractMDRValue.text)
					: null,

			posCommission:
				null,

			merchantComment:
				iMerchant_COMM.text
		};
	},


	// ============================================================
	// SUBMIT REQUEST
	// ============================================================

	submitRequest: async () => {

		try {

			// --------------------------------------------------------
			// Validate page mode
			// --------------------------------------------------------

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


			// --------------------------------------------------------
			// Validate request status
			// --------------------------------------------------------

			if (
				JS_PAGE.getRequestStatus() !==
				"ST-DRAFT"
			) {

				showAlert(
					"Only Draft requests can be submitted",
					"warning"
				);

				return {
					success: false
				};
			}


			// --------------------------------------------------------
			// Validate request ID
			// --------------------------------------------------------

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


			// --------------------------------------------------------
			// Confirmation Modal
			// --------------------------------------------------------

			


			// --------------------------------------------------------
			// Submit to Oracle
			// --------------------------------------------------------

			await SUBMIT_REQUEST.run();


			// --------------------------------------------------------
			// Refresh request
			// --------------------------------------------------------

			await MMS_MERCHANT_REQUEST.run();
			await QRY_Current_Request_Status.run();
			closeModal(mdSubmitConfirm.name);

			// --------------------------------------------------------
			// Success
			// --------------------------------------------------------

			showAlert(
				"Request submitted successfully",
				"success"
			);

			return {
				success: true,
				requestId: requestId
			};

		} catch (error) {

			console.log(
				"Submit merchant request failed:",
				error
			);

			showAlert(
				"Request submission failed",
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