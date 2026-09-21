export default {

    getMerchantId: () => {
        return appsmith.URL.queryParams.merchantId || "";
    },

    loadMerchant: async () => {
iCIF.setDisabled(true);
        const merchantId = JS_MERCHANT_DETAILS.getMerchantId();

        if (!merchantId) {
            showAlert(
                "Merchant ID is missing",
                "error"
            );

            return {
                success: false,
                error: "Merchant ID is missing"
            };
        }

        try {

            await QRY_Selected_Merchant.run();

            if (
                !QRY_Selected_Merchant.data ||
                QRY_Selected_Merchant.data.length === 0
            ) {
                showAlert(
                    "Merchant was not found",
                    "warning"
                );

                return {
                    success: false,
                    error: "Merchant not found"
                };
            }

            return {
                success: true,
                merchantId
            };

        } catch (error) {

            console.log(
                "Failed to load merchant:",
                error
            );

            showAlert(
                "Failed to load merchant information",
                "error"
            );

            return {
                success: false,
                error: error?.message || String(error)
            };
        }
    },

    backToMerchantWorkPlace: () => {

        navigateTo("MerchantWorkPlace");

    }
};