export default {

    getMerchantId: () => {
        return appsmith.store.MMS_SELECTED_MERCHANT_ID || "";
    },

    getRequestId: () => {
        return appsmith.store.MMS_SELECTED_REQUEST_ID || "";
    },

    clearMerchantSelection: async () => {

        await storeValue(
            "MMS_SELECTED_MERCHANT_ID",
            ""
        );

        await storeValue(
            "MMS_SELECTED_REQUEST_ID",
            ""
        );
    },

   selectMerchant: () => {

    const row = tblMerchant.selectedRow;

    if (!row || !row.MERCHANT_ID) {
        showAlert("Please select a merchant", "warning");
        return;
    }

    navigateTo(
        "MerchantDetails",
        {
            merchantId: row.MERCHANT_ID
        }
    );
}
};