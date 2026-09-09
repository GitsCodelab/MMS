export default {

    getRequestId: () => {
        return appsmith.URL.queryParams.requestId || "";
    },

    getTerminalId: () => {
        return tblTerminals.triggeredRow?.TERMINAL_ID || "";
    },

    getTerminalData: () => {
        return {
            posId: iPOSType.selectedOptionValue,
            posConditionId: iPOSCondition.selectedOptionValue,
					mccId:iPOSMcc.selectedOptionValue,
        };
    },

    addTerminal: () => {

        storeValue("MMS_TERMINAL_MODE", "ADD");
        storeValue("MMS_TERMINAL_EDIT_ID", "");

        showModal(mdTerminals.name);
    },

    editTerminal: () => {

        const requestId = this.getRequestId();
        const terminalId = this.getTerminalId();

        if (!requestId || String(requestId).trim() === "") {
            showAlert("Request ID is missing", "error");
            return;
        }

        if (!terminalId || String(terminalId).trim() === "") {
            showAlert("Terminal ID is missing", "error");
            return;
        }

        storeValue("MMS_TERMINAL_MODE", "EDIT");
        storeValue("MMS_TERMINAL_EDIT_ID", terminalId);

        showModal(mdTerminals.name);
    },

    deleteTerminal: () => {

        const requestId = this.getRequestId();
        const terminalId = this.getTerminalId();

        if (!requestId || String(requestId).trim() === "") {
            showAlert("Request ID is missing", "error");
            return;
        }

        if (!terminalId || String(terminalId).trim() === "") {
            showAlert("Terminal ID is missing", "error");
            return;
        }

        storeValue("MMS_TERMINAL_DELETE_ID", terminalId);

        showModal(mdDeleteTerminal.name);
    }

};