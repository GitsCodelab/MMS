export default {
  //--------------------------------------------------------------
  // Request ID
  //--------------------------------------------------------------
  getRequestId: () => {
    const urlRequestId =
      appsmith.URL.queryParams.requestId ||
      appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_ID ||
      "";

    return urlRequestId || "";
  },

  //--------------------------------------------------------------
  // Page Mode
  //
  // NEW  = creating a new Replace Terminal request
  // EDIT = editing an existing draft request
  //--------------------------------------------------------------
  getPageMode: () => {
    return appsmith.store.MMS_REPLACE_TERMINAL_PAGE_MODE || "NEW";
  },

  //--------------------------------------------------------------
  // Request Status
  //--------------------------------------------------------------
  getRequestStatus: () => {
    return qry_created_request.data?.[0]?.STATUS_CODE || "";
  },

  //--------------------------------------------------------------
  // Is Draft
  //
  // NEW page is considered editable before request creation.
  // Existing request is editable only when DB status is ST-DRAFT.
  //--------------------------------------------------------------
  isDraft: () => {
    const pageMode = JS_REPLACE_TERMINAL.getPageMode();

    const status = JS_REPLACE_TERMINAL.getRequestStatus();

    const requestCreated =
      appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_CREATED === true;

    // New request has not been created yet
    if (pageMode === "NEW") {
      return true;
    }

    // Existing request must explicitly be ST-DRAFT
    return pageMode === "EDIT" && requestCreated && status === "ST-DRAFT";
  },

  //--------------------------------------------------------------
  // Can Edit Request Fields
  //--------------------------------------------------------------
  canEditRequest: () => {
    return JS_REPLACE_TERMINAL.isDraft();
  },

  //--------------------------------------------------------------
  // Can Edit Merchant / Original Contract / Old Terminal
  //
  // These are source fields and can only be selected
  // before the Replace request is created.
  //--------------------------------------------------------------
  canEditSource: () => {
    return JS_REPLACE_TERMINAL.getPageMode() === "NEW";
  },

  //--------------------------------------------------------------
  // Can Edit New Terminal
  //
  // New terminal can be entered after request creation
  // while request remains ST-DRAFT.
  //--------------------------------------------------------------
  canEditTerminals: () => {
    return (
      JS_REPLACE_TERMINAL.isDraft() &&
      JS_REPLACE_TERMINAL.isTerminalSectionEnabled()
    );
  },

  //--------------------------------------------------------------
  // Can Save Draft
  //--------------------------------------------------------------
  canSaveDraft: () => {
    return JS_REPLACE_TERMINAL.isDraft();
  },

  //--------------------------------------------------------------
  // Can Submit
  //--------------------------------------------------------------
  canSubmit: () => {
    return (
     JS_REPLACE_TERMINAL.getPageMode() ==="EDIT"
    );
  },

  //--------------------------------------------------------------
  // Merchant
  //--------------------------------------------------------------
  getMerchantId: () => {
    return iMerchant.selectedOptionValue || "";
  },

  //--------------------------------------------------------------
  // Original / Source Request
  //--------------------------------------------------------------
  getSourceRequestId: () => {
    return iMerchantContract.selectedOptionValue || "";
  },

  //--------------------------------------------------------------
  // Existing LIVE Terminal
  //--------------------------------------------------------------
  getOldTerminalId: () => {
    return iOldTerminal.selectedOptionValue || "";
  },

  //--------------------------------------------------------------
  // Request Data
  //
  // contractSerial is intentionally NOT sent.
  // Oracle generates it centrally.
  //--------------------------------------------------------------
  getCreateRequestData: () => {
    return {
      merchantId: JS_REPLACE_TERMINAL.getMerchantId(),

      sourceRequestId: JS_REPLACE_TERMINAL.getSourceRequestId(),

      oldTerminalId: JS_REPLACE_TERMINAL.getOldTerminalId(),

      requestDate: iRequestDate.selectedDate
        ? iRequestDate.selectedDate
        : new Date().toISOString(),

      //----------------------------------------------------------
      // Request-level assignments
      //----------------------------------------------------------
      rmId: iRMS.selectedOptionValue || "",

      teamLeaderId: iTeamLeader.selectedOptionValue || "",

      rmsOracleId: iRM_Oracle_CODE.selectedOptionValue || "",

      //----------------------------------------------------------
      // Maker
      //----------------------------------------------------------
      makerId: appsmith.user.username,

      //----------------------------------------------------------
      // Request Comment
      //----------------------------------------------------------
      requestComment: iRequestComment.text || "",
    };
  },

  //--------------------------------------------------------------
  // Validate Create Request
  //--------------------------------------------------------------
  validateContinue: () => {
    const merchantId = JS_REPLACE_TERMINAL.getMerchantId();

    const sourceRequestId = JS_REPLACE_TERMINAL.getSourceRequestId();

    const oldTerminalId = JS_REPLACE_TERMINAL.getOldTerminalId();

    //----------------------------------------------------------
    // Merchant
    //----------------------------------------------------------
    if (!merchantId) {
      showAlert("Please select a merchant", "warning");

      return false;
    }

    //----------------------------------------------------------
    // Original Contract
    //----------------------------------------------------------
    if (!sourceRequestId) {
      showAlert("Please select the original contract", "warning");

      return false;
    }

    //----------------------------------------------------------
    // Existing LIVE Terminal
    //----------------------------------------------------------
    if (!oldTerminalId) {
      showAlert("Please select the terminal to replace", "warning");

      return false;
    }

    //----------------------------------------------------------
    // Maker
    //----------------------------------------------------------
    if (!appsmith.user.username) {
      showAlert("Maker ID is missing", "error");

      return false;
    }

    return true;
  },

  //--------------------------------------------------------------
  // Generate New REQUEST_ID
  //--------------------------------------------------------------
  generateRequestId: async () => {
    const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase();

    await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", requestId);

    return requestId;
  },

  //--------------------------------------------------------------
  // Initialize Page
  //
  // THIS FUNCTION IS CALLED FROM PAGE LOAD.
  //
  // URL requestId exists -> EDIT
  // No URL requestId     -> NEW
  //--------------------------------------------------------------
  initializeRequest: async () => {
    if (appsmith.store.MMS_REPLACE_TERMINAL_PAGE_MODE != "NEW") {
      const urlRequestId = appsmith.URL.queryParams.requestId || "";

      //==========================================================
      // EXISTING REQUEST
      //==========================================================
      if (urlRequestId) {
        await storeValue("MMS_REPLACE_TERMINAL_PAGE_MODE", "EDIT");

        await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", urlRequestId);

        await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", true);

        await qry_created_request.run();

        return {
          success: true,
          mode: "EDIT",
          requestId: urlRequestId,
        };
      }
    } else {
      //new

      const requestId = await JS_REPLACE_TERMINAL.generateRequestId();
      await storeValue("MMS_REPLACE_TERMINAL_REQUEST_ID", requestId);

      //==========================================================
      // NEW REQUEST
      //==========================================================

      await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", false);

      return {
        success: true,
        mode: "NEW",
        requestId: "",
      };
    }
  },

  //--------------------------------------------------------------
  // Save / Create / Update Replace Request
  //--------------------------------------------------------------

  saveDraft: async () => {
    try {
      //----------------------------------------------------------
      // Validate UI input
      //----------------------------------------------------------
      if (!JS_REPLACE_TERMINAL.validateContinue()) {
        return {
          success: false,
          validationFailed: true,
        };
      }

      //----------------------------------------------------------
      // ONE Oracle procedure:
      // INSERT or UPDATE is decided by Oracle
      //----------------------------------------------------------
      await SAVE_REPLACE_TERMINAL.run();

      //----------------------------------------------------------
      // Request now exists
      //----------------------------------------------------------

      await storeValue("MMS_REPLACE_TERMINAL_REQUEST_CREATED", true);

      await storeValue("MMS_REPLACE_TERMINAL_PAGE_MODE", "EDIT");

      //----------------------------------------------------------
      // Refresh request
      //----------------------------------------------------------
      await qry_created_request.run();

      showAlert("Replace Terminal request saved successfully", "success");

      return {
        success: true,
        requestId: JS_REPLACE_TERMINAL.getRequestId(),
      };
    } catch (error) {
      console.log("Save Replace Terminal request failed:", error);

      showAlert(
        error?.message || "Failed to save Replace Terminal request",
        "error",
      );

      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  },

  //--------------------------------------------------------------
  // Terminal Section
  //--------------------------------------------------------------
  isTerminalSectionEnabled: () => {
    return (
      appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_CREATED === true &&
      !!JS_REPLACE_TERMINAL.getRequestId()
    );
  },

  //--------------------------------------------------------------
  // Save Draft Button Visibility
  //--------------------------------------------------------------
  isContinueVisible: () => {
    return JS_REPLACE_TERMINAL.isDraft();
  },

  //--------------------------------------------------------------
  // Submit Replace Terminal Request
  //--------------------------------------------------------------
  submitRequest: async () => {
    try {
      const requestId = JS_REPLACE_TERMINAL.getRequestId();

      //------------------------------------------------------
      // Request ID
      //------------------------------------------------------
      if (!requestId) {
        showAlert("Replace Terminal request ID is missing", "error");

        return {
          success: false,
          validationFailed: true,
        };
      }

      //------------------------------------------------------
      // Request must exist
      //------------------------------------------------------
      if (appsmith.store.MMS_REPLACE_TERMINAL_REQUEST_CREATED !== true) {
        showAlert("Please save the Replace Terminal request first", "warning");

        return {
          success: false,
          validationFailed: true,
        };
      }

      //------------------------------------------------------
      // Request must still be Draft
      //------------------------------------------------------
      if (JS_REPLACE_TERMINAL.getRequestStatus() !== "ST-DRAFT") {
        showAlert(
          "Only draft Replace Terminal requests can be submitted",
          "warning",
        );

        return {
          success: false,
          validationFailed: true,
        };
      }

      //------------------------------------------------------
      // New terminal section must be enabled
      //------------------------------------------------------
      if (!JS_REPLACE_TERMINAL.isTerminalSectionEnabled()) {
        showAlert(
          "Please save the Replace Terminal request before submitting",
          "warning",
        );

        return {
          success: false,
          validationFailed: true,
        };
      }

      //------------------------------------------------------
      // Submit
      //------------------------------------------------------
      await QRY_SUBMIT_REPLACE_TERMINAL.run();

      //------------------------------------------------------
      // Refresh request
      //------------------------------------------------------
      await qry_created_request.run();

      //------------------------------------------------------
      // Success
      //------------------------------------------------------
      showAlert("Replace Terminal request submitted successfully", "success");

      return {
        success: true,
        requestId: requestId,
      };
    } catch (error) {
      console.log("Submit Replace Terminal request failed:", error);

      showAlert(
        error?.message || "Failed to submit Replace Terminal request",
        "error",
      );

      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  },
};
