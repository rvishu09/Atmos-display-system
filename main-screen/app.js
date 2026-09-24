// =====================================================
// FACTORY DISPLAY SYSTEM
// MAIN DASHBOARD
// =====================================================


// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

const socket = io("http://localhost:5000");


// =====================================================
// DATA STORAGE
// =====================================================

let bays = [];

let lastProducts = {};



// =====================================================
// POPULATE BAY DROPDOWN
// =====================================================

function populateFLCBayDropdown() {

    const baySelect =
        document.getElementById("flcBayNo");

    if (!baySelect) {
        console.warn("[FLC BAY] flcBayNo not found");
        return;
    }

    baySelect.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select Bay";

    baySelect.appendChild(defaultOption);


    bays.forEach(bay => {

        const bayNo =
            bay["Bay No"];

        if (
            bayNo === undefined ||
            bayNo === null ||
            bayNo === ""
        ) {
            return;
        }

        const option =
            document.createElement("option");

        option.value =
            String(bayNo);

        option.textContent =
            `Bay ${bayNo}`;

        baySelect.appendChild(option);

    });


    console.log(
        "[FLC BAY DROPDOWN] Updated:",
        baySelect.options.length - 1,
        "bays"
    );
}

// =====================================================
// BAY SELECTION
// AUTO FILL IP ADDRESS + WAY NO.
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const baySelect =
            document.getElementById(
                "entryBayNo"
            );


        if (!baySelect) {

            console.error(
                "[BAY] entryBayNo element not found"
            );

            return;

        }


        baySelect.addEventListener(
            "change",
            function () {

                const selectedBayNo =
                    String(
                        this.value
                    );


                console.log(
                    "[BAY SELECTED]",
                    selectedBayNo
                );


                const selectedBay =
                    bays.find(
                        bay =>
                            String(
                                bay["Bay No"]
                            ) === selectedBayNo
                    );


                if (!selectedBay) {

                    document.getElementById(
                        "entryIP"
                    ).value = "";


                    document.getElementById(
                        "entryWayNo"
                    ).value = "";

                    return;

                }


                console.log(
                    "[SELECTED BAY DATA]",
                    selectedBay
                );


                // AUTO IP

                const ipInput =
                    document.getElementById(
                        "entryIP"
                    );

                if (ipInput) {

                    ipInput.value =
                        selectedBay[
                            "IP Address"
                        ] || "";

                }


                // AUTO WAY NO.

                const wayInput =
                    document.getElementById(
                        "entryWayNo"
                    );

                if (wayInput) {

                    wayInput.value =
                        selectedBay[
                            "Way No"
                        ] || "";

                }

            }
        );

    }
);


// =====================================================
// GET ALL BAYS
// =====================================================

async function loadBays() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/bays"
        );

        const result = await response.json();

        if (!result.success) {

            throw new Error(
                "Unable to load Bays"
            );

        }

        bays = result.data || [];

        console.log(
            "[BAYS LOADED]",
            bays
        );

        populateBayDropdown();

        populateFLCBayDropdown();

        renderBays();

    }

    catch (error) {

        console.error(
            "[BAY LOAD ERROR]",
            error
        );

        addLog(
            "ERROR: Unable to load Bay configuration"
        );

    }

}


// =====================================================
// INITIALIZE BAY STATUS
// =====================================================

function initializeBayStatus() {

    bays.forEach(bay => {

        bay.connected = false;

    });

}


// =====================================================
// RENDER BAY TABLE
// =====================================================

function renderBays() {

    const tableBody =
        document.getElementById(
            "bayTableBody"
        );

    if (!tableBody) {

        return;

    }


    if (!bays.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="loading"
                >
                    No Bays configured
                </td>
            </tr>
        `;

        updateSummary();

        return;

    }


    tableBody.innerHTML = "";


    bays.forEach(bay => {

        const bayNo =
            String(
                bay["Bay No"] ?? ""
            );

        const wayNo =
            String(
                bay["Way No"] ?? ""
            );

        const ip =
            String(
                bay["IP Address"] ?? ""
            );

        const port =
            String(
                bay["TCP Port"] ?? ""
            );


        const connected =
            bay.connected === true;


        const lastProduct =
            lastProducts[bayNo];


        const lastProductText =
            lastProduct
                ? `
                    <strong>
                        ${lastProduct.product || "--"}
                    </strong>
                    <br>
                    <small>
                        Serial: ${lastProduct.serialNo || "--"}
                    </small>
                `
                  : "--";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${wayNo}
                </strong>
            </td>

            <td>
                <strong>
                    ${bayNo}
                </strong>
            </td>

            <td>
                ${ip}
            </td>

            <td>
                ${port}
            </td>

            <td>

                ${
                    connected

                    ?

                    `
                    <span
                        class="badge connected"
                    >
                        CONNECTED
                    </span>
                    `

                    :

                    `
                    <span
                        class="badge offline"
                    >
                        OFFLINE
                    </span>
                    `
                }

            </td>

            <td>
                ${lastProductText}
            </td>
            <td>

                <button
                    class="edit-bay-button"
                    onclick="editBay('${bayNo}')"
                >
                    EDIT
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    updateSummary();

}


// =====================================================
// UPDATE SUMMARY
// =====================================================

function updateSummary() {

    const total =
        bays.length;


    const connected =
        bays.filter(
            bay =>
                bay.connected === true
        ).length;


    const offline =
        total - connected;


    document.getElementById(
        "totalBays"
    ).textContent = total;


    document.getElementById(
        "connectedBays"
    ).textContent = connected;


    document.getElementById(
        "offlineBays"
    ).textContent = offline;


    updateSystemStatus(
        connected > 0
    );

}


// =====================================================
// SYSTEM STATUS
// =====================================================

function updateSystemStatus(
    connected
) {

    const status =
        document.getElementById(
            "systemStatus"
        );

    const dot =
        document.getElementById(
            "systemStatusDot"
        );


    if (connected) {

        status.textContent =
            "System Online";

        dot.className =
            "status-dot online";

    }

    else {

        status.textContent =
            "Waiting for Bays";

        dot.className =
            "status-dot offline";

    }

}


// =====================================================
// TCP STATUS
// =====================================================

socket.on(
    "tcp-status",
    data => {

        console.log(
            "[TCP STATUS]",
            data
        );


        const bayNo =
            String(
                data.bayNo
            );


        const bay =
            bays.find(
                item =>
                    String(
                        item["Bay No"]
                    ) === bayNo
            );


        if (!bay) {

            console.warn(
                "Bay not found:",
                bayNo
            );

            return;

        }


        bay.connected =
            data.connected === true;


        renderBays();


        if (data.connected) {

            addLog(
                `[CONNECTED] Bay ${bayNo} - ${data.ipAddress}:${data.port}`
            );

        }

        else {

            addLog(
                `[OFFLINE] Bay ${bayNo}`
            );

        }

    }
);



// =====================================================
// PRODUCT DATA FROM TCP BAY
// =====================================================

socket.on(
    "product-data",
    product => {

        console.log(
            "[PRODUCT DATA]",
            product
        );

        updateProductOnMainScreen(
            product
        );

    }
);


// =====================================================
// PRODUCT DATA FROM FACTORY DATA ENTRY
// =====================================================

socket.on(
    "display-product",
    product => {

        console.log(
            "[DISPLAY PRODUCT]",
            product
        );

        updateProductOnMainScreen(
            product
        );

    }
);


// =====================================================
// UPDATE PRODUCT ON MAIN SCREEN
// =====================================================

function updateProductOnMainScreen(
    product
) {

    const bayNo =
        String(
            product.bayNo ?? ""
        );


    if (!bayNo) {

        console.warn(
            "[PRODUCT] Bay number missing",
            product
        );

        return;

    }


    // =============================================
    // SAVE LAST PRODUCT FOR THIS BAY
    // =============================================

    lastProducts[bayNo] =
        product;


    // =============================================
    // UPDATE LATEST PRODUCT SECTION
    // =============================================

    displayProduct(
        product
    );


    // =============================================
    // UPDATE BAY TABLE
    // =============================================

    renderBays();


    // =============================================
    // UPDATE LAST DATA TIME
    // =============================================

    const lastDataTime =
        document.getElementById(
            "lastDataTime"
        );


    if (lastDataTime) {

        lastDataTime.textContent =
            new Date().toLocaleTimeString();

    }


    // =============================================
    // LOG
    // =============================================

    addLog(
        `[DATA] Bay ${bayNo} | ` +
        `Serial: ${product.serialNo || "--"} | ` +
        `Product: ${product.product || "--"}`
    );

}

// =====================================================
// DISPLAY PRODUCT
// =====================================================

function displayProduct(product) {

    document.getElementById(
        "productEmpty"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "productData"
    ).classList.remove(
        "hidden"
    );


    document.getElementById(
        "productWay"
    ).textContent =
        product.wayNo || "--";


    document.getElementById(
        "productBay"
    ).textContent =
        product.bayNo || "--";


    document.getElementById(
        "productSerial"
    ).textContent =
        product.serialNo || "--";


    document.getElementById(
        "productName"
    ).textContent =
        product.product || "--";


    document.getElementById(
        "productModel"
    ).textContent =
        product.model || "--";


    document.getElementById(
        "productIP"
    ).textContent =
        product.ipAddress || "--";

}


// =====================================================
// LOG
// =====================================================

function addLog(message) {

    const log =
        document.getElementById(
            "tcpLog"
        );


    if (!log) {

        return;

    }


    const line =
        document.createElement(
            "div"
        );


    line.className =
        "log-line";


    line.textContent =
        `${new Date().toLocaleTimeString()} ${message}`;


    log.appendChild(line);


    log.scrollTop =
        log.scrollHeight;


    // Keep last 200 log lines

    while (
        log.children.length > 200
    ) {

        log.removeChild(
            log.firstChild
        );

    }

}


// =====================================================
// SOCKET CONNECTED
// =====================================================

socket.on(
    "connect",
    () => {

        console.log(
            "[SOCKET] Connected"
        );


        addLog(
            "[SYSTEM] Dashboard connected to backend"
        );


        loadBays();

    }
);


// =====================================================
// SOCKET DISCONNECTED
// =====================================================

socket.on(
    "disconnect",
    () => {

        console.log(
            "[SOCKET] Disconnected"
        );


        addLog(
            "[SYSTEM] Backend connection lost"
        );


        updateSystemStatus(
            false
        );

    }
);


// =====================================================
// REFRESH BUTTON
// =====================================================

const refreshButton = document.getElementById("refreshButton");

if (refreshButton) {
    refreshButton.addEventListener("click", () => {
        loadBays();
    });
}


// =====================================================
// CLEAR LOG
// =====================================================

const clearLogButton = document.getElementById("clearLogButton");

if (clearLogButton) {
    clearLogButton.addEventListener("click", () => {

        const log = document.getElementById("tcpLog");

        if (log) {
            log.innerHTML = "";
        }

    });
}

// =====================================================
// START
// =====================================================

loadBays();

// =====================================================
// FACTORY DATA ENTRY
// =====================================================

const sendDisplayButton =
    document.getElementById(
        "sendDisplayButton"
    );


const clearEntryButton =
    document.getElementById(
        "clearEntryButton"
    );


const entryMessage =
    document.getElementById(
        "entryMessage"
    );


const displayStatus =
    document.getElementById(
        "displayStatus"
    );


// =====================================================
// SEND PRODUCT TO SECONDARY DISPLAY
// =====================================================
if (sendDisplayButton) {

    sendDisplayButton.addEventListener(
        "click",
        async () => {

        const bayNo =
            document.getElementById(
                "entryBayNo"
            ).value.trim();


        const serialNo =
            document.getElementById(
                "entrySerialNo"
            ).value.trim();


        const product =
            document.getElementById(
                "entryProduct"
            ).value.trim();


        const model =
            document.getElementById(
                "entryModel"
            ).value.trim();


        const ipAddress =
            document.getElementById(
                "entryIP"
            ).value.trim();


        const qrValueInput =
            document.getElementById(
                "entryQR"
            ).value.trim();


        const wayNo =
            document.getElementById(
                "entryWayNo"
            ).value.trim();


        // =============================================
        // VALIDATION
        // =============================================

        if (
            !bayNo ||
            !serialNo ||
            !product ||
            !model
        ) {

            entryMessage.textContent =
                "Please fill Bay No, Serial No, Product and Model.";

            entryMessage.style.color =
                "red";

            return;

        }


        // =============================================
        // QR VALUE
        // If empty, use Serial No
        // =============================================

        const qrValue =
            qrValueInput || serialNo;


        // =============================================
        // PRODUCT OBJECT
        // =============================================

        const productData = {

            wayNo:
                wayNo || "",

            bayNo:
                bayNo,

            serialNo:
                serialNo,

            product:
                product,

            model:
                model,

            ipAddress:
                ipAddress,

            qrValue:
                qrValue

        };


        console.log(
            "[DISPLAY SEND]",
            productData
        );


        // =============================================
        // SEND TO BACKEND
        // =============================================

        try {

            displayStatus.textContent =
                "Sending...";


            const response =
                await fetch(
                    "http://localhost:5000/api/display",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                productData
                            )

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to send product"
                );

            }


            // =========================================
            // SUCCESS
            // =========================================

            displayStatus.textContent =
                "Sent";


            entryMessage.textContent =
                "✓ Product sent to Secondary Display";


            entryMessage.style.color =
                "green";


            // Update Latest Product on Main Screen too

            updateProductOnMainScreen(
                productData
            );


            addLog(
                `[DISPLAY] Sent Bay ${bayNo} | Serial: ${serialNo} | Product: ${product}`
            );


        }

        catch (error) {

            console.error(
                "[DISPLAY ERROR]",
                error
            );


            displayStatus.textContent =
                "Error";


            entryMessage.textContent =
                "✗ Unable to send product: " +
                error.message;


            entryMessage.style.color =
                "red";

        }

    }
);
}

// =====================================================
// CLEAR ENTRY
// =====================================================

if (clearEntryButton) {

    clearEntryButton.addEventListener(
        "click",
    () => {

        document.getElementById(
            "entryBayNo"
        ).value = "";


        document.getElementById(
            "entrySerialNo"
        ).value = "";


        document.getElementById(
            "entryProduct"
        ).value = "";


        document.getElementById(
            "entryModel"
        ).value = "";


        document.getElementById(
            "entryIP"
        ).value = "";


        document.getElementById(
            "entryQR"
        ).value = "";


        document.getElementById(
            "entryWayNo"
        ).value = "";


        entryMessage.textContent =
            "";


        displayStatus.textContent =
            "Ready";

    }
);
}
// =====================================================
// EDIT BAY
// =====================================================

function editBay(bayNo) {

    const bay =
        bays.find(
            item =>
                String(
                    item["Bay No"]
                ) === String(bayNo)
        );


    if (!bay) {

        alert(
            "Bay configuration not found"
        );

        return;

    }


    const wayNo =
        prompt(
            `Enter Way No. for Bay ${bayNo}:`,
            bay["Way No"] || ""
        );


    if (wayNo === null) {

        return;

    }


    const ipAddress =
        prompt(
            `Enter IP Address for Bay ${bayNo}:`,
            bay["IP Address"] || ""
        );


    if (ipAddress === null) {

        return;

    }


    const tcpPort =
        prompt(
            `Enter TCP Port for Bay ${bayNo}:`,
            bay["TCP Port"] || ""
        );


    if (tcpPort === null) {

        return;

    }


    saveBayConfiguration(
        bayNo,
        wayNo,
        ipAddress,
        tcpPort
    );

}
// =====================================================
// SAVE BAY CONFIGURATION
// =====================================================

async function saveBayConfiguration(
    bayNo,
    wayNo,
    ipAddress,
    tcpPort
) {

    try {

        console.log(
            "[BAY UPDATE]",
            {
                bayNo,
                wayNo,
                ipAddress,
                tcpPort
            }
        );


        const response =
            await fetch(
                `http://localhost:5000/api/bays/${bayNo}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            wayNo:
                                wayNo,

                            ipAddress:
                                ipAddress,

                            tcpPort:
                                tcpPort

                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to update Bay"
            );

        }


        console.log(
            "[BAY UPDATED]",
            result.data
        );


        // Update local bay data

        const index =
            bays.findIndex(
                item =>
                    String(
                        item["Bay No"]
                    ) === String(bayNo)
            );


        if (index !== -1) {

            bays[index] =
                result.data;

        }


        renderBays();


        addLog(
            `[BAY UPDATED] Bay ${bayNo} → ${ipAddress}:${tcpPort}`
        );


        alert(
            `Bay ${bayNo} updated successfully.\n\n` +
            `Way No: ${wayNo}\n` +
            `IP: ${ipAddress}\n` +
            `TCP Port: ${tcpPort}\n\n` +
            `TCP reconnection started.`
        );

    }

    catch (error) {

        console.error(
            "[BAY UPDATE ERROR]",
            error
        );


        alert(
            "Unable to update Bay:\n" +
            error.message
        );

    }

}
// =====================================================
// REAL-TIME BAY CONFIGURATION UPDATE
// =====================================================

socket.on(
    "bay-config-updated",
    updatedBay => {

        console.log(
            "[REAL TIME BAY UPDATE]",
            updatedBay
        );


        const index =
            bays.findIndex(
                bay =>
                    String(
                        bay["Bay No"]
                    ) ===
                    String(
                        updatedBay["Bay No"]
                    )
            );


        if (index !== -1) {

            bays[index] =
                updatedBay;

        }


        renderBays();


        // Update Factory Data Entry
        // if this Bay is currently selected

        const selectedBay =
            document.getElementById(
                "entryBayNo"
            );


        if (
            selectedBay &&
            String(
                selectedBay.value
            ) ===
            String(
                updatedBay["Bay No"]
            )
        ) {

            document.getElementById(
                "entryIP"
            ).value =
                updatedBay[
                    "IP Address"
                ] || "";


            document.getElementById(
                "entryWayNo"
            ).value =
                updatedBay[
                    "Way No"
                ] || "";

        }


        addLog(
            `[REAL TIME] Bay ${updatedBay["Bay No"]} configuration updated`
        );

    }
);

// =====================================================
// FLC PRODUCTS
// =====================================================

let flcProducts = {};



// =====================================================
// RENDER FLC TABLE
// =====================================================

function renderFLCTable() {

    const tbody =
        document.getElementById(
            "flcTableBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    const bayNumbers =
        Object.keys(
            flcProducts
        );


    if (
        bayNumbers.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-row"
                >

                    No FLC records found.

                    Click
                    <strong>
                        + ADD NEW
                    </strong>
                    to create one.

                </td>

            </tr>

        `;

        return;

    }


    bayNumbers.forEach(
        bayNo => {

            const item =
                flcProducts[
                    bayNo
                ];


            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.bayNo =
                bayNo;


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        item.wayNo || "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.bayNo || bayNo
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.serialNo || "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.product || "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.model || "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.qrValue || "--"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.ipAddress || "--"
                    )}
                </td>

                <td>

                    <span
                        class="flc-status published"
                    >
                        PUBLISHED
                    </span>

                </td>

                <td>

                    <div
                        class="flc-actions"
                    >

                        <button
                            class="edit-flc-button"
                            onclick="editFLC('${bayNo}')"
                        >
                            EDIT
                        </button>

                        <button
                            class="delete-flc-button"
                            onclick="deleteFLC('${bayNo}')"
                        >
                            DELETE
                        </button>

                    </div>

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

// =====================================================
// EDIT FLC ROW
// =====================================================

function editFLC(
    bayNo
) {

    const item =
        flcProducts[
            bayNo
        ];


    if (!item) {

        return;

    }


    const row =
        document.querySelector(
            `tr[data-bay-no="${bayNo}"]`
        );


    if (!row) {

        return;

    }


    row.classList.add(
        "editing"
    );


    row.innerHTML = `

        <td>

            <input
                class="flc-input"
                id="way-${bayNo}"
                value="${escapeHTML(
                    item.wayNo || ""
                )}"
            >

        </td>


        <td>

            <strong>
                ${escapeHTML(
                    bayNo
                )}
            </strong>

        </td>


        <td>

            <input
                class="flc-input"
                id="serial-${bayNo}"
                value="${escapeHTML(
                    item.serialNo || ""
                )}"
            >

        </td>


        <td>

            <input
                class="flc-input"
                id="product-${bayNo}"
                value="${escapeHTML(
                    item.product || ""
                )}"
            >

        </td>


        <td>

            <input
                class="flc-input"
                id="model-${bayNo}"
                value="${escapeHTML(
                    item.model || ""
                )}"
            >

        </td>


        <td>

            <input
                class="flc-input"
                id="qr-${bayNo}"
                value="${escapeHTML(
                    item.qrValue || ""
                )}"
            >

        </td>


        <td>

            <input
                class="flc-input"
                id="ip-${bayNo}"
                value="${escapeHTML(
                    item.ipAddress || ""
                )}"
            >

        </td>


        <td>

            <span
                class="flc-status editing-status"
            >
                EDITING
            </span>

        </td>


        <td>

            <div
                class="flc-actions"
            >

                <button
                    class="save-flc-button"
                    onclick="saveFLC('${bayNo}')"
                >
                    SAVE
                </button>


                <button
                    class="cancel-flc-button"
                    onclick="renderFLCTable()"
                >
                    CANCEL
                </button>

            </div>

        </td>

    `;

}

// =====================================================
// SAVE FLC
// =====================================================

async function saveFLC(
    bayNo
) {

    try {

        const productData = {

            bayNo:

                bayNo,


            wayNo:

                document.getElementById(
                    `way-${bayNo}`
                ).value.trim(),


            serialNo:

                document.getElementById(
                    `serial-${bayNo}`
                ).value.trim(),


            product:

                document.getElementById(
                    `product-${bayNo}`
                ).value.trim(),


            model:

                document.getElementById(
                    `model-${bayNo}`
                ).value.trim(),


            qrValue:

                document.getElementById(
                    `qr-${bayNo}`
                ).value.trim(),


            ipAddress:

                document.getElementById(
                    `ip-${bayNo}`
                ).value.trim()

        };


        const response =
            await fetch(

                `http://localhost:5000/api/products/${bayNo}`,

                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            productData
                        )

                }

            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        flcProducts[
            bayNo
        ] =
            result.data;


        renderFLCTable();


        console.log(
            "[FLC SAVED]",
            result.data
        );


    }

    catch (error) {

        console.error(
            "[FLC SAVE ERROR]",
            error
        );


        alert(
            "Unable to save:\n" +
            error.message
        );

    }

}

// =====================================================
// DELETE FLC
// =====================================================

async function deleteFLC(
    bayNo
) {

    const item =
        flcProducts[
            bayNo
        ];


    if (!item) {

        return;

    }


    const confirmed =
        confirm(
            `Delete product for Bay ${bayNo}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(

                `http://localhost:5000/api/products/${bayNo}`,

                {

                    method:
                        "DELETE"

                }

            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        delete flcProducts[
            bayNo
        ];


        renderFLCTable();


        console.log(
            `[FLC] Bay ${bayNo} deleted`
        );

    }

    catch (error) {

        console.error(
            "[FLC DELETE ERROR]",
            error
        );


        alert(
            "Unable to delete:\n" +
            error.message
        );

    }

}

    // =====================================================
// INITIAL FLC DATA
// =====================================================

socket.on(
    "products-initial",
    products => {

        console.log(
            "[FLC INITIAL]",
            products
        );


        flcProducts =
            products || {};


        renderFLCTable();

    }
);


// =====================================================
// REAL-TIME PRODUCT UPDATE
// =====================================================

socket.on(
    "product-updated",
    product => {

        console.log(
            "[FLC REAL-TIME UPDATE]",
            product
        );


        const bayNo =
            String(
                product.bayNo
            );


        flcProducts[
            bayNo
        ] =
            product;


        renderFLCTable();

    }
);


// =====================================================
// REAL-TIME PRODUCT DELETE
// =====================================================

socket.on(
    "product-deleted",
    data => {

        console.log(
            "[FLC REAL-TIME DELETE]",
            data
        );


        const bayNo =
            String(
                data.bayNo
            );


        delete flcProducts[
            bayNo
        ];


        renderFLCTable();

    }
);


// =====================================================
// LOAD FLC PRODUCTS
// =====================================================

async function loadFLCProducts() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/products"
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                "Unable to load FLC products"
            );

        }


        flcProducts =
            result.data || {};


        renderFLCTable();

    }

    catch (error) {

        console.error(
            "[FLC LOAD ERROR]",
            error
        );

    }

}




    
// =====================================================
// FLC ADD NEW
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const addButton =
        document.getElementById("addFLCButton");

    const modal =
        document.getElementById("flcModal");

    const closeButton =
        document.getElementById("closeFLCButton");

    const cancelButton =
        document.getElementById("cancelFLCButton");

    const saveButton =
        document.getElementById("saveNewFLCButton");
      const flcBaySelect =
    document.getElementById("flcBayNo");

const flcIPInput =
    document.getElementById("flcIPAddress");


if (flcBaySelect) {

    flcBaySelect.addEventListener(
        "change",
        function () {

            const selectedBayNo =
                String(this.value);

            if (!selectedBayNo) {

                flcIPInput.value = "";

                return;
            }


            const selectedBay =
                bays.find(
                    bay =>
                        String(
                            bay["Bay No"]
                        ) === selectedBayNo
                );


            if (!selectedBay) {

                flcIPInput.value = "";

                return;
            }


            flcIPInput.value =
                selectedBay["IP Address"] || "";


            console.log(
                "[FLC BAY SELECTED]",
                selectedBay
            );

        }
    );

}


    console.log("[FLC] Add New system loaded");


    // =================================================
    // ADD NEW BUTTON
    // =================================================

    if (addButton) {

    addButton.addEventListener(
        "click",
        function () {

            console.log(
                "[FLC] ADD NEW clicked"
            );

            // Refresh Bay dropdown every time
            populateFLCBayDropdown();

            clearFLCForm();

            modal.classList.remove(
                "hidden"
            );

        }
    );

}

   

    // =================================================
    // CANCEL
    // =================================================

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeFLCForm
        );

    }


    // =================================================
    // SAVE
    // =================================================

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            addNewFLCRecord
        );

    }


    // =================================================
    // CLICK OUTSIDE MODAL
    // =================================================

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeFLCForm();

                }

            }
        );

    }

});


// =====================================================
// CLEAR FLC FORM
// =====================================================

function clearFLCForm() {

    const fields = [

        "flcWayNo",
        "flcBayNo",
        "flcSerialNo",
        "flcProduct",
        "flcModel",
        "flcQRData",
        "flcIPAddress"

    ];


    fields.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.value = "";

            }

        }
    );

}


// =====================================================
// CLOSE FLC FORM
// =====================================================

function closeFLCForm() {

    const modal =
        document.getElementById("flcModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// ADD NEW FLC RECORD
// =====================================================

async function addNewFLCRecord() {

    try {

        // =============================================
        // GET VALUES
        // =============================================

        const wayNo =
            document
                .getElementById("flcWayNo")
                .value
                .trim();


        const bayNo =
            document
                .getElementById("flcBayNo")
                .value
                .trim();


        const serialNo =
            document
                .getElementById("flcSerialNo")
                .value
                .trim();


        const product =
            document
                .getElementById("flcProduct")
                .value
                .trim();


        const model =
            document
                .getElementById("flcModel")
                .value
                .trim();


        const qrValue =
            document
                .getElementById("flcQRData")
                .value
                .trim();


        const ipAddress =
            document
                .getElementById("flcIPAddress")
                .value
                .trim();


        // =============================================
        // VALIDATION
        // =============================================

        if (!wayNo) {

            alert(
                "Please enter Way No."
            );

            return;

        }


        if (!bayNo) {

            alert(
                "Please select Bay No."
            );

            return;

        }


        if (!serialNo) {

            alert(
                "Please enter Serial No."
            );

            return;

        }


        if (!product) {

            alert(
                "Please enter Product."
            );

            return;

        }


        if (!model) {

            alert(
                "Please enter Model."
            );

            return;

        }


        if (!qrValue) {

            alert(
                "Please enter QR Data."
            );

            return;

        }


        if (!ipAddress) {

            alert(
                "Please enter IP Address."
            );

            return;

        }


        // =============================================
        // DUPLICATE BAY CHECK
        // =============================================

        if (
            flcProducts &&
            flcProducts[bayNo]
        ) {

            alert(
                `Bay ${bayNo} already has an FLC record.\n\nUse EDIT to change it.`
            );

            return;

        }


        // =============================================
        // PRODUCT OBJECT
        // =============================================

        const productData = {

            bayNo: bayNo,

            wayNo: wayNo,

            serialNo: serialNo,

            product: product,

            model: model,

            qrValue: qrValue,

            ipAddress: ipAddress

        };


        console.log(
            "[FLC ADD]",
            productData
        );


        // =============================================
        // SEND TO BACKEND
        // =============================================

        const response =
            await fetch(
                `http://localhost:5000/api/products/${bayNo}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            productData
                        )

                }
            );


        const result =
            await response.json();


        console.log(
            "[FLC ADD RESPONSE]",
            result
        );


        // =============================================
        // CHECK RESPONSE
        // =============================================

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Server error"
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to add FLC"
            );

        }


        // =============================================
        // UPDATE LOCAL TABLE
        // =============================================

        flcProducts[bayNo] =
            result.data;


        renderFLCTable();


        // =============================================
        // CLOSE MODAL
        // =============================================

        closeFLCForm();


        // =============================================
        // SUCCESS
        // =============================================

        alert(
            `FLC successfully added for Bay ${bayNo}`
        );


        console.log(
            "[FLC] Successfully added",
            result.data
        );

    }

    catch (error) {

        console.error(
            "[FLC ADD ERROR]",
            error
        );


        alert(
            "Unable to add FLC:\n\n" +
            error.message
        );
    }
}