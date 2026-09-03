export default {
  openUrlInModal(url) {
    // 1. Save the URL to the app state
    storeValue("targetUrl", url);
    
    // 2. Open the modal container
    showModal("mdlWebPreview");
  }
}
