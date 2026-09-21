export default {

	openMerchantDetail:()=>{
		storeValue(  "MMS_SELECTED_MERCHANT_ID",  tblWorkplace.selectedRow.MERCHANT_ID);

		storeValue(  "MMS_SELECTED_REQUEST_ID",  tblWorkplace.selectedRow.REQUEST_ID);



		navigateTo("MerchantWorkPlace");
	},  
	openRequest: () => {

		var  row = tblWorkplace.selectedRow;

		if (!row) {
			showAlert(
				"Please select a request",
				"warning"
			);
			return;
		}

		const requestId = row.REQUEST_ID;

		if (!requestId) {
			showAlert(
				"Request ID is missing",
				"error"
			);
			return;
		}

		const requestTypeId =
					Number(row.REQUEST_TYPE_ID);

		if (!Number.isFinite(requestTypeId)) {
			showAlert(
				"Request Type ID is missing",
				"error"
			);
			return;
		}

		switch (Number(tblWorkplace.selectedRow.REQUEST_TYPE_ID)) {

			case 1:

				navigateTo(
					"MakerEditMerchantRequest",
					{
						requestId: requestId
					}
				);

				break;

			case 2:

				navigateTo(
					"AddTerminal",
					{
						requestId: requestId
					}
				);

				break;

			case 3:
				navigateTo(
					"MakerReplaceTerminal",
					{
						requestId: requestId
					},
					"SAME_WINDOW"
				);


				break;

			case 4:

				showAlert(
					"Terminate Terminal is not implemented yet",
					"info"
				);

				break;

			case 5:

				showAlert(
					"Terminate Merchant is not implemented yet",
					"info"
				);

				break;

			default:

				showAlert(
					"Unknown request type: " +
					requestTypeId,
					"error"
				);
		}
	}

};