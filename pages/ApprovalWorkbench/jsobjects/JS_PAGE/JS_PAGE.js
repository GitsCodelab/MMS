export default {
	selectActivity: () => {
		const row =tblApproval.triggeredRow || null;
		showAlert(row)
		return{
			ACTIVITY_ID: row.ACTIVITY_ID, 
			REQUEST_ID : row.REQUEST_ID
		}
		
	},

	approve: async () => {
		await DECIDE_APPROVAL.run({
			decision: "APPROVED",
			reasonCode: "",
			comment: ""
		});

		this.clearDecision();
	},
	confirmedActions:async()=>{

		switch (appsmith.store.confirmAction) {
			case "APPROVED":
				this.approve();
				break; // Exits the switch block
			case "REJECTED":
				this.reject();
				break;
			case "PUSHED_BACK":
				this.pushBack();
				break;
			default: // Executed if no cases match
				console.log("Unknown role.");
				break;
		}


		closeModal(mdConfirm.name);

	},
	confirmActionMsg :async()=>{
		showModal(mdConfirm.name)
	},
	reject: async () => {
		const row = tblApproval.selectedRow;

		this.clearDecision();

	},

	pushBack: async () => {
		const row = tblApproval.selectedRow;


		this.clearDecision();
	},


	clearDecision: () => {

		removeValue(
			"MMS_APPROVAL_DECISION"
		);

		resetWidget("iReason", true);
		resetWidget("iNote", true);

	}
};