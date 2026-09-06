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
		return "{{appsmith.URL.queryParams.requestId}}";
	},

	getRequestData: () => {
		return {
			contractSerial: iContractSerial.text,

			requestDate: MMS_MERCHANT_REQUEST.data?.[0]?.REQUEST_DATE || null,

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

			contractMdr: iContractMDR.text? Number(iContractMDR.text)				: null,
			posCommission: null,
			
		};
	}
}