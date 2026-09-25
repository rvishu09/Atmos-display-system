// =====================================================
// FACTORY DISPLAY SYSTEM
// MAIN DASHBOARD
// =====================================================


// =====================================================
// CONFIGURATION
// =====================================================

const BACKEND_URL = "http://localhost:5000";


// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

const socket = io(BACKEND_URL);


// =====================================================
// DATA STORAGE
// =====================================================

let bays = [];

let lastProducts = {};

let flcProducts = {};


// =====================================================
// COMMUNICATION STATUS
// =====================================================

let communicationStatus = {};

let communicationTimers = {};

const COMMUNICATION_TIMEOUT = 15000;


// =====================================================
// UTILITY
// =====================================================

function normalizeBayNo(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "";
    }

    return String(value);
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// FORMAT BAY NUMBER
// 1 -> 001
// 2 -> 002
// 10 -> 010
// =====================================================

function formatBayNo(value) {

    const number = parseInt(value, 10);

    if (Number.isNaN(number)) {
        return String(value ?? "");
    }

    return String(number).padStart(3, "0");
}


// =====================================================
// POPULATE FLC BAY DROPDOWN
// =====================================================

function populateFLCBayDropdown() {

    const baySelect =
        document.getElementById("flcBayNo");

    if (!baySelect) {
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
            normalizeBayNo(bay["Bay No"]);

        if (!bayNo) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = bayNo;

        option.textContent =
            `Bay ${formatBayNo(bayNo)}`;

        baySelect.appendChild(option);

    });

    console.log(
        "[FLC BAY DROPDOWN] Updated:",
        baySelect.options.length - 1,
        "bays"
    );
}


// =====================================================
// FLC BAY SELECTION
// AUTO FILL IP
// =====================================================

function setupFLCBaySelection() {

    const baySelect =
        document.getElementById("flcBayNo");

    if (!baySelect) {
        return;
    }

    baySelect.addEventListener(
        "change",
        function () {

            const selectedBayNo =
                normalizeBayNo(this.value);

            const selectedBay =
                bays.find(
                    bay =>
                        normalizeBayNo(
                            bay["Bay No"]
                        ) === selectedBayNo
                );

            const ipInput =
                document.getElementById(
                    "flcIPAddress"
                );

            if (!selectedBay) {

                if (ipInput) {
                    ipInput.value = "";
                }

                return;
            }

            if (ipInput) {

                ipInput.value =
                    selectedBay["IP Address"] || "";

            }

        }
    );
}


// =====================================================
// FACTORY BAY SELECTION
// =====================================================

function setupFactoryBaySelection() {

    const baySelect =
        document.getElementById("entryBayNo");

    if (!baySelect) {
        return;
    }

    baySelect.addEventListener(
        "change",
        function () {

            const selectedBayNo =
                normalizeBayNo(this.value);

            const selectedBay =
                bays.find(
                    bay =>
                        normalizeBayNo(
                            bay["Bay No"]
                        ) === selectedBayNo
                );

            const ipInput =
                document.getElementById("entryIP");

            const wayInput =
                document.getElementById("entryWayNo");

            if (!selectedBay) {

                if (ipInput) {
                    ipInput.value = "";
                }

                if (wayInput) {
                    wayInput.value = "";
                }

                return;
            }

            if (ipInput) {
                ipInput.value =
                    selectedBay["IP Address"] || "";
            }

            if (wayInput) {
                wayInput.value =
                    selectedBay["Way No"] || "";
            }

        }
    );
}


// =====================================================
// LOAD ALL BAYS
// =====================================================

async function loadBays() {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/bays`
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Unable to load Bays"
            );
        }

        bays =
            result.data || [];

        console.log(
            "[BAYS LOADED]",
            bays
        );

        initializeBayStatus();

        populateFLCBayDropdown();

        setupFactoryBayDropdown();

        renderBays();

        renderFLCTable();

    }

    catch (error) {

        console.error(
            "[BAY LOAD ERROR]",
            error
        );

        addLog(
            "[ERROR] Unable to load Bay configuration"
        );

        updateSummary();
    }
}


// =====================================================
// INITIALIZE BAY STATUS
// =====================================================

function initializeBayStatus() {

    bays.forEach(
        bay => {

            if (
                typeof bay.connected !==
                "boolean"
            ) {

                bay.connected = false;

            }

            const bayNo =
                normalizeBayNo(
                    bay["Bay No"]
                );

            if (
                communicationStatus[bayNo] ===
                undefined
            ) {

                communicationStatus[bayNo] =
                    false;

            }

        }
    );
}


// =====================================================
// FACTORY BAY DROPDOWN
// =====================================================

function setupFactoryBayDropdown() {

    const select =
        document.getElementById(
            "entryBayNo"
        );

    if (!select) {
        return;
    }

    if (
        typeof populateBayDropdown ===
        "function"
    ) {

        try {

            populateBayDropdown(bays);

        }

        catch (error) {

            console.warn(
                "[ENTRY BAY] Existing dropdown function failed",
                error
            );

        }

    }
}


// =====================================================
// UPDATE SUMMARY
// =====================================================

function updateSummary() {

    const totalBays =
        bays.length > 0
            ? bays.length
            : Object.keys(flcProducts).length;


    const connectedBays =
        bays.filter(
            bay =>
                bay.connected === true
        ).length;


    const communicationBays =
        Object.values(
            communicationStatus
        ).filter(
            status =>
                status === true
        ).length;


    const offlineBays =
        bays.length > 0
            ? bays.filter(
                bay =>
                    bay.connected !== true
            ).length
            : Object.keys(flcProducts).length;


    const totalElement =
        document.getElementById(
            "totalBays"
        );

    if (totalElement) {

        totalElement.textContent =
            totalBays;

    }


    const connectedElement =
        document.getElementById(
            "connectedBays"
        );

    if (connectedElement) {

        connectedElement.textContent =
            connectedBays;

    }


    const communicationElement =
        document.getElementById(
            "communicationStatusSummary"
        );

    if (communicationElement) {

        communicationElement.textContent =
            communicationBays;

    }


    const offlineElement =
        document.getElementById(
            "offlineBays"
        );

    if (offlineElement) {

        offlineElement.textContent =
            offlineBays;

    }
}


// =====================================================
// RENDER BAY STATUS
// =====================================================

function renderBays() {

    const tableBody =
        document.getElementById(
            "bayTableBody"
        );


    // Old Bay Status table was removed.
    // Still update the summary.

    if (!tableBody) {

        updateSummary();

        return;
    }


    if (!bays.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
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


    bays.forEach(
        (bay, index) => {

            const bayNo =
                normalizeBayNo(
                    bay["Bay No"]
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


            let lastProductText =
                "--";


            if (lastProduct) {

                lastProductText = `
                    <strong>
                        ${escapeHTML(
                            lastProduct.product ||
                            "--"
                        )}
                    </strong>
                    <br>
                    <small>
                        Serial:
                        ${escapeHTML(
                            lastProduct.serialNo ||
                            "--"
                        )}
                    </small>
                `;

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${index + 1}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            formatBayNo(bayNo)
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(ip)}
                </td>

                <td>
                    ${escapeHTML(port)}
                </td>

                <td>

                    ${
                        connected
                        ?
                        `
                        <span
                            class="connection-status connected"
                        >
                            <span
                                class="status-indicator green"
                            ></span>
                            CONNECTED
                        </span>
                        `
                        :
                        `
                        <span
                            class="connection-status disconnected"
                        >
                            <span
                                class="status-indicator red"
                            ></span>
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
                        onclick="editBay('${escapeHTML(
                            bayNo
                        )}')"
                    >
                        EDIT
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    updateSummary();
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

    if (!status || !dot) {
        return;
    }


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
// TCP CONNECTION STATUS
// =====================================================

socket.on(
    "tcp-status",
    data => {

        console.log(
            "[TCP STATUS]",
            data
        );


        const bayNo =
            normalizeBayNo(
                data.bayNo
            );


        const bay =
            bays.find(
                item =>
                    normalizeBayNo(
                        item["Bay No"]
                    ) === bayNo
            );


        if (!bay) {

            console.warn(
                "[TCP STATUS] Bay not found:",
                bayNo
            );

            return;
        }


        bay.connected =
            data.connected === true;


        renderBays();

        renderFLCTable();

        updateSummary();


        if (data.connected) {

            addLog(
                `[CONNECTED] Bay ${formatBayNo(
                    bayNo
                )} - ${data.ipAddress || ""}:${data.port || ""}`
            );

        }

        else {

            addLog(
                `[OFFLINE] Bay ${formatBayNo(
                    bayNo
                )}`
            );

        }

    }
);


// =====================================================
// COMMUNICATION STATUS
// =====================================================

socket.on(
    "communication-status",
    data => {

        console.log(
            "[COMMUNICATION STATUS]",
            data
        );


        const bayNo =
            normalizeBayNo(
                data.bayNo
            );


        if (!bayNo) {
            return;
        }


        communicationStatus[bayNo] =
            data.communicating === true;


        if (
            communicationTimers[bayNo]
        ) {

            clearTimeout(
                communicationTimers[bayNo]
            );

        }


        if (
            data.communicating === true
        ) {

            communicationTimers[bayNo] =
                setTimeout(
                    () => {

                        communicationStatus[
                            bayNo
                        ] = false;


                        renderFLCTable();

                        updateSummary();


                        addLog(
                            `[COMMUNICATION LOST] Bay ${formatBayNo(
                                bayNo
                            )} has not sent data recently`
                        );

                    },
                    COMMUNICATION_TIMEOUT
                );

        }


        renderFLCTable();

        updateSummary();

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


        if (
            product &&
            product.bayNo !== undefined
        ) {

            markBayCommunicating(
                product.bayNo
            );

        }


        updateProductOnMainScreen(
            product
        );

    }
);


// =====================================================
// DISPLAY PRODUCT
// =====================================================

socket.on(
    "display-product",
    product => {

        console.log(
            "[DISPLAY PRODUCT]",
            product
        );


        if (
            product &&
            product.bayNo !== undefined
        ) {

            markBayCommunicating(
                product.bayNo
            );

        }


        updateProductOnMainScreen(
            product
        );

    }
);
// =====================================================
// MARK BAY AS COMMUNICATING
// =====================================================

function markBayCommunicating(
    bayNo
) {

    const normalized =
        normalizeBayNo(bayNo);


    if (!normalized) {
        return;
    }


    communicationStatus[
        normalized
    ] = true;


    if (
        communicationTimers[
            normalized
        ]
    ) {

        clearTimeout(
            communicationTimers[
                normalized
            ]
        );

    }


    communicationTimers[
        normalized
    ] =
        setTimeout(
            () => {

                communicationStatus[
                    normalized
                ] = false;


                renderFLCTable();

                updateSummary();

            },
            COMMUNICATION_TIMEOUT
        );


    renderFLCTable();

    updateSummary();
}


// =====================================================
// UPDATE PRODUCT ON MAIN SCREEN
// =====================================================

function updateProductOnMainScreen(
    product
) {

    if (!product) {

        console.warn(
            "[PRODUCT] No product data"
        );

        return;
    }


    const bayNo =
        normalizeBayNo(
            product.bayNo
        );


    if (!bayNo) {

        console.warn(
            "[PRODUCT] Bay number missing",
            product
        );

        return;
    }


    lastProducts[
        bayNo
    ] = product;


    displayProduct(
        product
    );


    renderBays();

    renderFLCTable();


    addLog(
        `[DATA] Bay ${formatBayNo(
            bayNo
        )} | Serial: ${
            product.serialNo || "--"
        } | Product: ${
            product.product || "--"
        }`
    );
}


// =====================================================
// DISPLAY LATEST PRODUCT
// =====================================================

function displayProduct(
    product
) {

    if (!product) {
        return;
    }


    const bayElement =
        document.getElementById(
            "productBay"
        );


    const productElement =
        document.getElementById(
            "productName"
        );


    const modelElement =
        document.getElementById(
            "productModel"
        );


    const ipElement =
        document.getElementById(
            "productIP"
        );


    if (bayElement) {

        bayElement.textContent =
            formatBayNo(
                product.bayNo
            );

    }


    // These are kept for compatibility
    // with your existing project.
    // If removed from HTML, nothing happens.

    if (productElement) {

        productElement.textContent =
            product.product || "--";

    }


    if (modelElement) {

        modelElement.textContent =
            product.model || "--";

    }


    if (ipElement) {

        ipElement.textContent =
            product.ipAddress || "--";

    }


    try {

        localStorage.setItem(
            "latestProductData",
            JSON.stringify(product)
        );

    }

    catch (error) {

        console.warn(
            "[STORAGE] Unable to save latest product",
            error
        );

    }
}


// =====================================================
// LOAD LAST PRODUCT
// =====================================================

function loadStoredLatestProduct() {

    try {

        const stored =
            localStorage.getItem(
                "latestProductData"
            );


        if (!stored) {
            return;
        }


        const product =
            JSON.parse(stored);


        if (product) {

            displayProduct(
                product
            );

        }

    }

    catch (error) {

        console.warn(
            "[STORAGE] Unable to restore product",
            error
        );

    }
}


// =====================================================
// TCP LOG
// =====================================================

function addLog(
    message
) {

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


    log.appendChild(
        line
    );


    log.scrollTop =
        log.scrollHeight;


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


        updateSystemStatus(
            true
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


        bays.forEach(
            bay => {

                bay.connected =
                    false;

            }
        );


        Object.keys(
            communicationStatus
        ).forEach(
            bayNo => {

                communicationStatus[
                    bayNo
                ] = false;

            }
        );


        renderBays();

        renderFLCTable();

        updateSummary();


        updateSystemStatus(
            false
        );

    }
);


// =====================================================
// REFRESH BUTTON
// =====================================================

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        () => {

            loadBays();

        }
    );

}


// =====================================================
// CLEAR LOG
// =====================================================

const clearLogButton =
    document.getElementById(
        "clearLogButton"
    );


if (clearLogButton) {

    clearLogButton.addEventListener(
        "click",
        () => {

            const log =
                document.getElementById(
                    "tcpLog"
                );


            if (log) {

                log.innerHTML = "";

            }

        }
    );

}


// =====================================================
// FLC TABLE
// =====================================================

function renderFLCTable() {

    const tbody =
        document.getElementById(
            "flcTableBody"
        );


    if (!tbody) {

        updateSummary();

        return;
    }


    tbody.innerHTML = "";


    const bayNumbers =
        Object.keys(
            flcProducts
        ).sort(
            (a, b) =>
                Number(a) - Number(b)
        );


    if (
        bayNumbers.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-row"
                >
                    No FLC records found.
                    Click
                    <strong>+ ADD NEW</strong>
                    to create one.
                </td>

            </tr>

        `;


        updateSummary();

        return;
    }


    bayNumbers.forEach(
        (bayNo, index) => {

            const item =
                flcProducts[
                    bayNo
                ] || {};


            const bay =
                bays.find(
                    currentBay =>
                        normalizeBayNo(
                            currentBay["Bay No"]
                        ) ===
                        normalizeBayNo(
                            bayNo
                        )
                );


            const connected =
                bay
                    ? bay.connected === true
                    : false;


            const communicating =
                communicationStatus[
                    bayNo
                ] === true;


            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.bayNo =
                bayNo;


            // -----------------------------------------
            // CONNECTION STATUS
            // -----------------------------------------

            let connectionHTML;


            if (connected) {

                connectionHTML = `

                    <span
                        class="connection-status connected"
                    >

                        <span
                            class="status-indicator green"
                        ></span>

                        CONNECTED

                    </span>

                `;

            }

            else {

                connectionHTML = `

                    <span
                        class="connection-status disconnected"
                    >

                        <span
                            class="status-indicator red"
                        ></span>

                        OFFLINE

                    </span>

                `;

            }


            // -----------------------------------------
            // COMMUNICATION STATUS
            // -----------------------------------------

            let communicationHTML;


            if (communicating) {

                communicationHTML = `

                    <span
                        class="communication-status communicating"
                    >

                        <span
                            class="status-indicator green"
                        ></span>

                        COMMUNICATING

                    </span>

                `;

            }

            else {

                communicationHTML = `

                    <span
                        class="communication-status not-communicating"
                    >

                        <span
                            class="status-indicator red"
                        ></span>

                        NOT COMMUNICATING

                    </span>

                `;

            }


            // -----------------------------------------
            // ORDER ID
            // -----------------------------------------

            const orderId =
                item.orderId ||
                "--";


            // -----------------------------------------
            // TABLE ROW
            // -----------------------------------------

            row.innerHTML = `

                            <!-- S.NO -->

                <td
                    class="sno-cell"                  
                    title="Click S.No. to show actions"
                >

                    <strong>
                        ${index + 1}
                    </strong>

                </td>


                <!-- BAY NO -->

                <td>

                    <strong class="bay-number">

                        ${escapeHTML(
                            formatBayNo(
                                item.bayNo ||
                                bayNo
                            )
                        )}

                    </strong>

                </td>


                <!-- ORDER ID -->

                <td>

                    <span class="order-id">

                        ${escapeHTML(
                            orderId
                        )}

                    </span>

                </td>


                <!-- CONNECTION STATUS -->

                <td>

                    ${connectionHTML}

                </td>


                <!-- COMMUNICATION STATUS -->

                <td>

                    ${communicationHTML}

                </td>


                <!-- ACTION -->

                <td>

                    <div
                            class="action-buttons"
                            style="display: none !important;"
                        >

                        <button
                            class="edit-flc-button"
                            onclick="editFLC('${escapeHTML(
                                bayNo
                            )}')"
                        >
                            EDIT
                        </button>


                        <button
                            class="delete-flc-button"
                            onclick="deleteFLC('${escapeHTML(
                                bayNo
                            )}')"
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


    updateSummary();
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


        Object.keys(
            flcProducts
        ).forEach(
            bayNo => {

                if (
                    communicationStatus[
                        bayNo
                    ] === undefined
                ) {

                    communicationStatus[
                        bayNo
                    ] = false;

                }

            }
        );


        renderFLCTable();

        updateSummary();

    }
);
// =====================================================
// SHOW / HIDE FLC ACTION BUTTONS
// =====================================================

function toggleFLCActions(snoCell) {

    console.log(
        "[S.NO CLICKED]",
        snoCell.innerText
    );


    const row =
        snoCell.closest("tr");


    if (!row) {

        console.error(
            "[ACTION] Row not found"
        );

        return;

    }


    const tbody =
        document.getElementById(
            "flcTableBody"
        );


    if (!tbody) {

        console.error(
            "[ACTION] FLC table body not found"
        );

        return;

    }


    // -----------------------------------------
    // HIDE ALL OTHER ACTION BUTTONS
    // -----------------------------------------

    tbody
        .querySelectorAll(
            ".action-buttons"
        )
        .forEach(
            buttons => {

                buttons.style.setProperty(
                    "display",
                    "none",
                    "important"
                );

            }
        );


    // -----------------------------------------
    // REMOVE SELECTED FROM ALL ROWS
    // -----------------------------------------

    tbody
        .querySelectorAll("tr")
        .forEach(
            currentRow => {

                currentRow.classList.remove(
                    "selected-row"
                );

            }
        );


    // -----------------------------------------
    // SELECT CLICKED ROW
    // -----------------------------------------

    row.classList.add(
        "selected-row"
    );


    // -----------------------------------------
    // FIND ACTION BUTTONS
    // -----------------------------------------

    const actionButtons =
        row.querySelector(
            ".action-buttons"
        );


    if (!actionButtons) {

        console.error(
            "[ACTION] .action-buttons NOT FOUND"
        );

        return;

    }


    // -----------------------------------------
    // FORCE SHOW
    // -----------------------------------------

    actionButtons.style.setProperty(
        "display",
        "flex",
        "important"
    );


    console.log(
        "[ACTION] EDIT / DELETE SHOWN"
    );

}


// =====================================================
// PRODUCT UPDATED
// =====================================================

socket.on(
    "product-updated",
    product => {

        console.log(
            "[FLC REAL-TIME UPDATE]",
            product
        );


        if (!product) {
            return;
        }


        const bayNo =
            normalizeBayNo(
                product.bayNo
            );


        if (!bayNo) {
            return;
        }


        flcProducts[
            bayNo
        ] = product;


        renderFLCTable();


        updateProductOnMainScreen(
            product
        );


        updateSummary();

    }
);


// =====================================================
// PRODUCT DELETED
// =====================================================

socket.on(
    "product-deleted",
    data => {

        console.log(
            "[FLC REAL-TIME DELETE]",
            data
        );


        if (!data) {
            return;
        }


        const bayNo =
            normalizeBayNo(
                data.bayNo
            );


        delete flcProducts[
            bayNo
        ];


        communicationStatus[
            bayNo
        ] = false;


        renderFLCTable();

        updateSummary();

    }
);
// =====================================================
// FLC MODAL ELEMENTS
// =====================================================

const addFLCButton =
    document.getElementById(
        "addFLCButton"
    );


const flcModal =
    document.getElementById(
        "flcModal"
    );


const closeFLCButton =
    document.getElementById(
        "closeFLCButton"
    );


const cancelFLCButton =
    document.getElementById(
        "cancelFLCButton"
    );


const saveNewFLCButton =
    document.getElementById(
        "saveNewFLCButton"
    );


// =====================================================
// OPEN FLC MODAL
// =====================================================

if (addFLCButton) {

    addFLCButton.addEventListener(
        "click",
        () => {

            clearFLCForm();


            populateFLCBayDropdown();


            const title =
                document.getElementById(
                    "flcModalTitle"
                );


            if (title) {

                title.textContent =
                    "Add FLC Details";

            }


            if (saveNewFLCButton) {

                saveNewFLCButton.textContent =
                    "ADD FLC";

            }


            if (flcModal) {

                flcModal.classList.remove(
                    "hidden"
                );

            }

        }
    );

}


// =====================================================
// CLOSE FLC MODAL
// =====================================================

function closeFLCForm() {

    if (flcModal) {

        flcModal.classList.add(
            "hidden"
        );

    }

}


if (closeFLCButton) {

    closeFLCButton.addEventListener(
        "click",
        closeFLCForm
    );

}


if (cancelFLCButton) {

    cancelFLCButton.addEventListener(
        "click",
        closeFLCForm
    );

}


if (flcModal) {

    flcModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                flcModal
            ) {

                closeFLCForm();

            }

        }
    );

}


// =====================================================
// CLEAR FLC FORM
// =====================================================

function clearFLCForm() {

    const fields = [

        "flcBayNo",

        "flcOrderID",

        "flcQRData",

        "flcIPAddress"

    ];


    fields.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value = "";

            }

        }
    );
}


// =====================================================
// ADD NEW FLC
// =====================================================

async function addNewFLCRecord() {

    try {

        const bayNo =
            document.getElementById(
                "flcBayNo"
            ).value.trim();


        const orderId =
            document.getElementById(
                "flcOrderID"
            ).value.trim();


        const qrValue =
            document.getElementById(
                "flcQRData"
            ).value.trim();


        const ipAddress =
            document.getElementById(
                "flcIPAddress"
            ).value.trim();


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (!bayNo) {

            alert(
                "Please select Bay No."
            );

            return;
        }


        if (!orderId) {

            alert(
                "Please enter Order ID."
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
                "IP Address was not found for this Bay."
            );

            return;
        }


        // -----------------------------------------
        // DUPLICATE CHECK
        // -----------------------------------------

        if (
            flcProducts[
                bayNo
            ]
        ) {

            alert(
                `Bay ${formatBayNo(
                    bayNo
                )} already has an FLC record.

Use EDIT to change it.`
            );

            return;
        }


        // -----------------------------------------
        // DATA
        // -----------------------------------------

        const productData = {

            bayNo:
                String(bayNo),

            orderId:
                orderId,

            serialNo:
                "",

            qrValue:
                qrValue,

            ipAddress:
                ipAddress

        };


        console.log(
            "[FLC ADD]",
            productData
        );


        // -----------------------------------------
        // SEND TO BACKEND
        // -----------------------------------------

        const response =
            await fetch(
                `${BACKEND_URL}/api/products/${bayNo}`,
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


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to add FLC"
            );

        }


        // -----------------------------------------
        // UPDATE LOCAL DATA
        // -----------------------------------------

        flcProducts[
            bayNo
        ] = result.data;


        renderFLCTable();

        updateSummary();

        closeFLCForm();


        addLog(
            `[FLC] Bay ${formatBayNo(
                bayNo
            )} added with Order ID ${orderId}`
        );


        console.log(
            "[FLC ADDED]",
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


// =====================================================
// SAVE BUTTON
// =====================================================

if (saveNewFLCButton) {

    saveNewFLCButton.addEventListener(
        "click",
        addNewFLCRecord
    );

}


// =====================================================
// EDIT FLC
// =====================================================

function editFLC(
    bayNo
) {

    const item =
        flcProducts[
            bayNo
        ];


    if (!item) {

        alert(
            "FLC record not found."
        );

        return;
    }


    const row =
        document.querySelector(
            `tr[data-bay-no="${CSS.escape(
                String(bayNo)
            )}"]`
        );


    if (!row) {
        return;
    }


    const connected =
        (() => {

            const bay =
                bays.find(
                    currentBay =>
                        normalizeBayNo(
                            currentBay[
                                "Bay No"
                            ]
                        ) ===
                        normalizeBayNo(
                            bayNo
                        )
                );

            return bay
                ? bay.connected === true
                : false;

        })();


    const communicating =
        communicationStatus[
            bayNo
        ] === true;


    row.innerHTML = `

        <!-- S.NO -->

        <td>

            <strong>
                ${getFLCSNo(bayNo)}
            </strong>

        </td>


        <!-- BAY -->

        <td>

            <strong>

                ${escapeHTML(
                    formatBayNo(
                        bayNo
                    )
                )}

            </strong>

        </td>


        <!-- ORDER ID -->

        <td>

            <input
                type="text"
                class="flc-input"
                id="order-${escapeHTML(
                    bayNo
                )}"
                value="${escapeHTML(
                    item.orderId || ""
                )}"
                placeholder="Order ID"
            >

        </td>


        <!-- CONNECTION -->

        <td>

            ${
                connected
                ?
                `
                <span
                    class="connection-status connected"
                >
                    CONNECTED
                </span>
                `
                :
                `
                <span
                    class="connection-status disconnected"
                >
                    OFFLINE
                </span>
                `
            }

        </td>


        <!-- COMMUNICATION -->

        <td>

            ${
                communicating
                ?
                `
                <span
                    class="communication-status communicating"
                >
                    COMMUNICATING
                </span>
                `
                :
                `
                <span
                    class="communication-status not-communicating"
                >
                    NOT COMMUNICATING
                </span>
                `
            }

        </td>


        <!-- ACTION -->

        <td>

            <div
                class="action-buttons"
            >

                <button
                    class="edit-flc-button"
                    onclick="saveFLC('${escapeHTML(
                        bayNo
                    )}')"
                >
                    SAVE
                </button>


                <button
                    class="delete-flc-button"
                    onclick="renderFLCTable()"
                >
                    CANCEL
                </button>

            </div>

        </td>

    `;

}


// =====================================================
// GET FLC S.NO
// =====================================================

function getFLCSNo(
    bayNo
) {

    const bayNumbers =
        Object.keys(
            flcProducts
        ).sort(
            (a, b) =>
                Number(a) - Number(b)
        );


    const index =
        bayNumbers.indexOf(
            String(bayNo)
        );


    return index >= 0
        ? index + 1
        : "--";
}


// =====================================================
// SAVE EDITED FLC
// =====================================================

async function saveFLC(
    bayNo
) {

    try {

        const orderInput =
            document.getElementById(
                `order-${bayNo}`
            );


        if (!orderInput) {

            throw new Error(
                "Order ID field not found."
            );

        }


        const orderId =
            orderInput.value.trim();


        if (!orderId) {

            alert(
                "Please enter Order ID."
            );

            return;
        }


        const item =
            flcProducts[
                bayNo
            ] || {};


        const productData = {

            bayNo:
                String(bayNo),

            orderId:
                orderId,

            serialNo:
                item.serialNo || "",

            qrValue:
                item.qrValue || "",

            ipAddress:
                item.ipAddress || ""

        };


        const response =
            await fetch(
                `${BACKEND_URL}/api/products/${bayNo}`,
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


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to save FLC"
            );

        }


        flcProducts[
            bayNo
        ] = result.data;


        renderFLCTable();

        updateSummary();


        addLog(
            `[FLC] Bay ${formatBayNo(
                bayNo
            )} Order ID updated`
        );


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
            "Unable to save:\n\n" +
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
            `Delete FLC record for Bay ${formatBayNo(
                bayNo
            )}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/products/${bayNo}`,
                {

                    method: "DELETE"

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to delete FLC"
            );

        }


        delete flcProducts[
            bayNo
        ];


        communicationStatus[
            bayNo
        ] = false;


        renderFLCTable();

        updateSummary();


        addLog(
            `[FLC] Bay ${formatBayNo(
                bayNo
            )} deleted`
        );


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
            "Unable to delete:\n\n" +
            error.message
        );

    }
}
// =====================================================
// BAY CONFIGURATION UPDATED
// =====================================================

socket.on(
    "bay-config-updated",
    updatedBay => {

        console.log(
            "[BAY CONFIG UPDATED]",
            updatedBay
        );


        if (!updatedBay) {
            return;
        }


        const bayNo =
            normalizeBayNo(
                updatedBay[
                    "Bay No"
                ]
            );


        const index =
            bays.findIndex(
                bay =>
                    normalizeBayNo(
                        bay["Bay No"]
                    ) === bayNo
            );


        if (index !== -1) {

            const oldConnected =
                bays[index].connected;


            bays[index] = {

                ...updatedBay,

                connected:
                    oldConnected

            };

        }


        populateFLCBayDropdown();

        renderBays();

        renderFLCTable();

        updateSummary();


        addLog(
            `[REAL TIME] Bay ${formatBayNo(
                bayNo
            )} configuration updated`
        );

    }
);


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

            try {

                const getValue =
                    id => {

                        const element =
                            document.getElementById(
                                id
                            );

                        return element
                            ? element.value.trim()
                            : "";

                    };


                const bayNo =
                    getValue(
                        "entryBayNo"
                    );


                const serialNo =
                    getValue(
                        "entrySerialNo"
                    );


                const product =
                    getValue(
                        "entryProduct"
                    );


                const model =
                    getValue(
                        "entryModel"
                    );


                const ipAddress =
                    getValue(
                        "entryIP"
                    );


                const qrValue =
                    getValue(
                        "entryQR"
                    );


                const wayNo =
                    getValue(
                        "entryWayNo"
                    );


                if (!bayNo) {

                    alert(
                        "Please select Bay."
                    );

                    return;
                }


                const data = {

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
                        qrValue,

                    wayNo:
                        wayNo

                };


                console.log(
                    "[DISPLAY DATA]",
                    data
                );


                const response =
                    await fetch(
                        `${BACKEND_URL}/api/display`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    data
                                )

                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to send display data"
                    );

                }


                if (entryMessage) {

                    entryMessage.textContent =
                        "Data sent successfully.";

                }


                if (displayStatus) {

                    displayStatus.textContent =
                        "DISPLAY UPDATED";

                }


                addLog(
                    `[DISPLAY] Bay ${formatBayNo(
                        bayNo
                    )} updated`
                );

            }

            catch (error) {

                console.error(
                    "[DISPLAY ERROR]",
                    error
                );


                alert(
                    "Unable to send display data:\n\n" +
                    error.message
                );

            }

        }
    );

}


// =====================================================
// CLEAR FACTORY DATA ENTRY
// =====================================================

if (clearEntryButton) {

    clearEntryButton.addEventListener(
        "click",
        () => {

            const fields = [

                "entryBayNo",

                "entrySerialNo",

                "entryProduct",

                "entryModel",

                "entryIP",

                "entryQR",

                "entryWayNo"

            ];


            fields.forEach(
                id => {

                    const element =
                        document.getElementById(
                            id
                        );


                    if (element) {

                        element.value = "";

                    }

                }
            );


            if (entryMessage) {

                entryMessage.textContent =
                    "";

            }


            if (displayStatus) {

                displayStatus.textContent =
                    "";

            }

        }
    );

}


// =====================================================
// INITIAL START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupFLCBaySelection();

        setupFactoryBaySelection();

        loadStoredLatestProduct();

        loadBays();

        updateSummary();

    }
);


// =====================================================
// ALSO LOAD IMMEDIATELY
// =====================================================

loadBays();


// =====================================================
// FINAL SUMMARY UPDATE
// =====================================================

updateSummary();
