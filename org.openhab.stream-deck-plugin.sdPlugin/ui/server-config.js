// Shared Server Config Modal for Stream Deck Property Inspectors
(function () {
    // Inject modal HTML into the root div
    function injectModal() {
        const root = document.getElementById("server-config-root");
        if (!root) return;
        root.innerHTML = `
      <sdpi-item label="Server Configuration">
        <button id="open-server-config">Configure Server</button>
      </sdpi-item>
      <div id="server-config-modal" style="display:none; background: #222; padding: 16px; border-radius: 4px; position: fixed; top: 20%; left: 50%; transform: translateX(-50%); z-index: 1000;">
        <sdpi-item label="Host">
          <sdpi-textfield id="serverHost"></sdpi-textfield>
        </sdpi-item>
        <sdpi-item label="Port">
          <sdpi-textfield id="serverPort"></sdpi-textfield>
        </sdpi-item>
        <sdpi-item label="API Key">
          <sdpi-textfield id="apiKey"></sdpi-textfield>
        </sdpi-item>
        <button id="save-server-config">Save</button>
        <button id="close-server-config">Close</button>
      </div>
    `;
    }

    document.addEventListener("DOMContentLoaded", function () {
        injectModal();
        const { streamDeckClient } = window.SDPIComponents || {};
        const openBtn = document.getElementById("open-server-config");
        const modal = document.getElementById("server-config-modal");
        const closeBtn = document.getElementById("close-server-config");
        const saveBtn = document.getElementById("save-server-config");

        if (!streamDeckClient) {
            alert("streamDeckClient not available. Make sure SDPIComponents v3+ is loaded.");
            return;
        }

        if (openBtn) {
            openBtn.addEventListener("click", () => {
                modal.style.display = "block";
                streamDeckClient.getGlobalSettings().then(globalSettings => {
                    if (globalSettings) {
                        document.getElementById("serverHost").value = globalSettings.serverHost || "";
                        document.getElementById("serverPort").value = globalSettings.serverPort || "";
                        document.getElementById("apiKey").value = globalSettings.apiKey || "";
                    }
                });
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                const serverHost = document.getElementById("serverHost").value;
                const serverPort = document.getElementById("serverPort").value;
                const apiKey = document.getElementById("apiKey").value;

                try {
                    streamDeckClient.setGlobalSettings({ serverHost, serverPort, apiKey });
                    modal.style.display = "none";
                } catch (err) {
                    alert("Error saving global settings: " + err);
                }
            });
        }

    });
})();
