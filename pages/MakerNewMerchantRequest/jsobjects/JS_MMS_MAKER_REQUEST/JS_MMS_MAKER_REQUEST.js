export default {
  getRequestData() {
    return {
      identity: {
        cif: iCIF.text,
        nationalId: iNationalID.text,
        ownerNameAr: iOwnerName.text,
        companyName: iCompanyName.text,
        merchantNameEn: iMerchantNameEN.text,
        merchantNameAr: iMerchantNameAR.text
      },

      contact: {
        contactNameAr: iContactName.text,
        mobilePrimary: PhoneInput1.phoneNumber,
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
        contractMdr: iMDR.text
      },

      equipment: {
        pos: iPOS.selectedOptionValue,
        posCondition: iPOS_Condition.selectedOptionValue
      },

      merchantComment: iMerchant_COMM.text
    };
  }
};