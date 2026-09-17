export default {
	getStatus() {
		return QRY_Merchant_REQUEST.data?.[0]?.STATUS_CODE || "";
	},

	isDraft() {
		return this.getStatus() === "ST-DRAFT";
	},

	isSubmitted() {
		return this.getStatus() === "ST-SUBMITTED";
	},

	isMakerEditable() {
		return this.isDraft();
	},

	applyEditState() {
		const editable = this.isMakerEditable();
		showAlert(editable);
		

		return editable;
	},

	getEditState() {
		const editable = this.isMakerEditable();

		return {
			status: this.getStatus(),
			editable: editable,
			disabled: !editable
		};
	}
}