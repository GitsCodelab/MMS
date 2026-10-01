export default {
	selectActivity: () => {
		const row =tblApproval.triggeredRow || null;
		showAlert(row)
		return{
			ACTIVITY_ID: row.ACTIVITY_ID, 
			REQUEST_ID : row.REQUEST_ID
		}

	},

	confirmedActions:async()=>{
		await DECIDE_APPROVAL.run({
			decision:appsmith.store.confirmAction
		});
		await PENDING_APPROVALS.run();
		closeModal(mdConfirm.name);
		this.clearDecision();
	},

	confirmActionMsg :async()=>{
		this.clearDecision();
		await ACTIVITY_REASON.run();
		showModal(mdConfirm.name)
	},
	clearDecision: () => {
		resetWidget("iReason", true);
		resetWidget("iNote", true);

	}
};