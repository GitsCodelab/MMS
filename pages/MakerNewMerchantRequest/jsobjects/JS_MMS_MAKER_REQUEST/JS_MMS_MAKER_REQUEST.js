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

			posCommission: iPOSCommission.text
			? Number(iPOSCommission.text)
			: null,

			pos: iPOS.selectedOptionValue,
			posCondition: iPOS_Condition.selectedOptionValue,

			merchantComment: iMerchant_COMM.text
		};
	}
};