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

	getRequestData: () => {
		return {
			requestTypeId: 1,

			contractSerial: iContractSerial.text,
			requestDate: new Date().toISOString(),

			cif: iCIF.text,
			nationalId: String(iNationalID.text || ""),

			ownerNameAr: iOwnerName.text,

			companyName: iCompanyName.text,
			companyNameAr: iCompanyNameAR.text,

			merchantNameEn: iMerchantNameEN.text,
			merchantNameAr: iMerchantNameAR.text,

			contactNameAr: iContactName.text?.text || "",
			mobilePrimary: iMobilePrumary.text,

			addressEn: iAddressEN.text,
			addressAr: iAddressAR.text,

			city: iCity.text,
			region: iRegion.text,

			branchCode: iBranch.selectedOptionValue,
			teamLeader: iTeamLeader.selectedOptionValue,
			rmOracleCode: iRM_Oracle_CODE.selectedOptionValue,

			bankAccount: iBankAccount.text,

			mccId: iMCC.selectedOptionValue,
			packageId: iPackage.selectedOptionValue,

			contractMdr: iContractMDR.text
				? Number(iContractMDR.text)
				: null,

			contractMdrValue: iContractMDRValue.text
				? Number(iContractMDRValue.text)
				: null,

			posCommission: null,

			merchantComment: iMerchant_COMM.text
		};
	},

	createRequest: async () => {

    try {

        const requestId = await JS_LIB.generateRequestId();

        if (!requestId) {
            throw new Error("Request ID was not generated");
        }

        // 1. Create Oracle request
        await UPD_MMS_CREATE_REQUEST.run();

        // 2. Upload documents
        if (files.files && files.files.length > 0) {

            const uploadResult =
                await JS_MMS_DOCUMENTS.uploadAll();

            console.log(
                "Upload summary:",
                uploadResult
            );

            if (!uploadResult.success) {

                showAlert(
                    `Request created, but ${uploadResult.failed} document(s) failed to upload`,
                    "warning"
                );

                return {
                    success: false,
                    requestCreated: true,
                    requestId: requestId,
                    uploadResult: uploadResult
                };
            }
        }

        showAlert(
            "Request is created successfully",
            "success"
        );
			
		navigateTo(
    "MakerEditMerchantRequest",
    {
        requestId: requestId
    }
);
        return {
            success: true,
            requestId: requestId
        };

    } catch (error) {

        console.log(
            "Create request failed:",
            error
        );

        showAlert(
            "Your request failed to be created",
            "error"
        );

        return {
            success: false,
            error: error?.message || String(error)
        };
    }
}
	
	
	
};