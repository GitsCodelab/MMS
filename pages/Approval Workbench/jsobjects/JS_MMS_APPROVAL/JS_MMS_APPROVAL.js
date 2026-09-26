export default {
    selectActivity: () => {
        const row = tblApproval.selectedRow;
        if (row) {
            storeValue("MMS_SELECTED_APPROVAL_ACTIVITY_ID", row.ACTIVITY_ID);
            storeValue("MMS_SELECTED_APPROVAL_REQUEST_ID", row.REQUEST_ID);
        }
    },

    approve: async () => {
        const row = tblApproval.selectedRow;
        if (!row) {
            showAlert("Please select an approval activity.", "warning");
            return;
        }
        await DECIDE_APPROVAL.run({
            decision: "APPROVED",
            reasonCode: "",
            comment: ""
        });
    },

    reject: async () => {
        const row = tblApproval.selectedRow;
        if (!row) {
            showAlert("Please select an approval activity.", "warning");
            return;
        }
        storeValue("MMS_APPROVAL_DECISION", "REJECTED");
        showModal("mdDecision");
    },

    pushBack: async () => {
        const row = tblApproval.selectedRow;
        if (!row) {
            showAlert("Please select an approval activity.", "warning");
            return;
        }
        storeValue("MMS_APPROVAL_DECISION", "PUSHED_BACK");
        showModal("mdDecision");
    },

    submitDecision: async () => {
        const decision = appsmith.store.MMS_APPROVAL_DECISION;
        const reason = InputReasonCode.text || "";
        const comment = InputDecisionComment.text || "";

        if (!reason.trim() && !comment.trim()) {
            showAlert("Reason code or comment is required.", "warning");
            return;
        }

        await DECIDE_APPROVAL.run({
            decision: decision,
            reasonCode: reason,
            comment: comment
        });

        closeModal("mdDecision");
        resetWidget("InputReasonCode", true);
        resetWidget("InputDecisionComment", true);
    },

    clearDecision: () => {
        removeValue("MMS_APPROVAL_DECISION");
        closeModal("mdDecision");
    }
};