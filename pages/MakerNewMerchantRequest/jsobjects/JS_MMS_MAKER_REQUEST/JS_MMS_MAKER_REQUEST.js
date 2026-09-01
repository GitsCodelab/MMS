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
			request: {
				contractSerial: iContractSerial.text,
				requestDate: new Date().toISOString()
			},

			identity: {
				cif: iCIF.text,
				nationalId: String(iNationalID.text || ""),
				ownerNameAr: iOwnerName.text,
				companyName: iCompanyName.text,
				merchantNameEn: iMerchantNameEN.text,
				merchantNameAr: iMerchantNameAR.text
			},

			contact: {
				contactNameAr: iContactName.text.text,
				addressEn: iAddressEN.text,
				addressAr: iAddressAR.text
			},

			location: {
				city: iCity.text,
				region: iRegion.text,
				branchCode: iBranch.selectedOptionValue,
				teamLeader: iTeamLeader.selectedOptionValue,
				rmOracleCode: iRM_Oracle_CODE.selectedOptionValue
			},

			commercial: {
				bankAccount: iBankAccount.text,
				mccId: iMCC.selectedOptionValue,
				packageId: iPackage.selectedOptionValue,
				contractMdr: iContractMDR.text
				? Number(iContractMDR.text)
				: null,
				contractMdrValue: iContractMDR.text
				? Number(iContractMDR.text)
				: null,
				posCommission: iPOSCommission.text
				? Number(iPOSCommission.text)
				: null
			},

			equipment: {
				pos: iPOS.selectedOptionValue,
				posCondition: iPOS_Condition.selectedOptionValue
			},

			merchantComment: iMerchant_COMM.text
		};
	}
}