// =====================================================
// SECONDARY BAY DISPLAY
// =====================================================

// Backend is automatically taken from the computer
// hosting the secondary screen.
const API =
    `${window.location.protocol}//${window.location.hostname}:5000`;


// =====================================================
// BAY NUMBER
// =====================================================

// Example:
// http://192.168.0.135:5501/?bay=001

const params =
    new URLSearchParams(
        window.location.search
    );

const SCREEN_BAY =
    String(
        params.get("bay") || ""
    ).trim();


console.log(
    "[SECONDARY] Assigned Bay:",
    SCREEN_BAY
);


// =====================================================
// SOCKET.IO
// =====================================================

const socket =
    io(API);


// =====================================================
// FORMAT BAY NUMBER
// 1 -> 001
// 2 -> 002
// 12 -> 012
// =====================================================

function formatBayNo(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "---";
    }

    return String(value)
        .padStart(3, "0");
}


// =====================================================
// CHECK WHETHER DATA BELONGS TO THIS SCREEN
// =====================================================

function isThisBay(data) {

    if (!SCREEN_BAY) {
        return true;
    }

    if (!data) {
        return false;
    }

    return (
        String(
            data.bayNo ??
            data["Bay No"] ??
            ""
        ) === SCREEN_BAY
        ||
        formatBayNo(
            data.bayNo ??
            data["Bay No"] ??
            ""
        ) === formatBayNo(SCREEN_BAY)
    );
}


// =====================================================
// CONNECTION
// =====================================================

socket.on(
    "connect",
    () => {

        console.log(
            "[SECONDARY] Connected to backend"
        );

        updateConnection(
            `● BAY ${formatBayNo(SCREEN_BAY)} CONNECTED`
        );

        // Tell backend which bay this screen belongs to
        socket.emit(
            "register-secondary",
            {
                bayNo: SCREEN_BAY
            }
        );

        loadSavedProduct();

    }
);


socket.on(
    "disconnect",
    () => {

        updateConnection(
            "● DISCONNECTED"
        );

    }
);


// =====================================================
// TCP CONNECTION STATUS
// =====================================================

socket.on(
    "tcp-status",
    data => {

        if (!isThisBay(data)) {
            return;
        }

        console.log(
            "[SECONDARY TCP STATUS]",
            data
        );

        if (data.connected) {

            updateConnection(
                `● BAY ${formatBayNo(data.bayNo)} CONNECTED`
            );

        } else {

            updateConnection(
                `● BAY ${formatBayNo(data.bayNo)} DISCONNECTED`
            );

        }

    }
);


// =====================================================
// TCP PRODUCT DATA
// =====================================================

socket.on(
    "product-data",
    product => {

        if (!isThisBay(product)) {
            return;
        }

        console.log(
            "[SECONDARY PRODUCT]",
            product
        );

        displayProduct(
            product
        );

    }
);


// =====================================================
// MASTER PC REAL-TIME UPDATE
// =====================================================

socket.on(
    "product-updated",
    product => {

        if (!isThisBay(product)) {
            return;
        }

        console.log(
            "[MASTER REAL-TIME UPDATE]",
            product
        );

        displayProduct(
            product
        );

        updateConnection(
            `● BAY ${formatBayNo(product.bayNo)} UPDATED`
        );

    }
);


// =====================================================
// DELETE
// =====================================================

socket.on(
    "product-deleted",
    data => {

        if (!isThisBay(data)) {
            return;
        }

        clearDisplay();

    }
);


// =====================================================
// DISPLAY PRODUCT
// =====================================================

socket.on(
    "display-product",
    product => {

        if (!isThisBay(product)) {
            return;
        }

        displayProduct(
            product
        );

    }
);


// =====================================================
// DISPLAY PRODUCT
// =====================================================

function displayProduct(product) {

    if (!product) {
        return;
    }


    const bayNo =
        product.bayNo ||
        SCREEN_BAY;


    // ---------------------------------------------
    // BAY NUMBER
    // ---------------------------------------------

    const bayElement =
        document.getElementById(
            "bayNo"
        );

    if (bayElement) {

        bayElement.textContent =
            formatBayNo(bayNo);

    }


    // ---------------------------------------------
    // ORDER ID
    // ---------------------------------------------

    const orderElement =
        document.getElementById(
            "orderId"
        );

    if (orderElement) {

        orderElement.textContent =
            product.orderId ||
            "-";

    }


    // ---------------------------------------------
    // QR DATA
    // ---------------------------------------------

    const qrValue =
        getQRValue(
            product.qrValue
        );


    const qrDataElement =
        document.getElementById(
            "qrData"
        );

    if (qrDataElement) {

        qrDataElement.textContent =
            qrValue ||
            "-";

    }


    // ---------------------------------------------
    // GENERATE QR
    // ---------------------------------------------

    generateQR(
        qrValue
    );


    // ---------------------------------------------
    // SAVE
    // ---------------------------------------------

    try {

        localStorage.setItem(
            `secondaryBay_${formatBayNo(bayNo)}`,
            JSON.stringify(product)
        );

    } catch (error) {

        console.error(
            "[STORAGE ERROR]",
            error
        );

    }

}


// =====================================================
// GET QR VALUE
// Supports old JSON QR format too
// =====================================================

function getQRValue(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }


    const text =
        String(value);


    // New format = plain QR data
    if (
        !text.trim().startsWith("{")
    ) {
        return text;
    }


    // Old format = JSON
    try {

        const parsed =
            JSON.parse(text);


        if (
            parsed.qrData !== undefined
        ) {

            return String(
                parsed.qrData
            );

        }

    } catch (error) {

        console.warn(
            "[QR] Old QR JSON could not be parsed"
        );

    }


    return text;

}


// =====================================================
// QR GENERATION
// =====================================================

function generateQR(
    qrValue
) {

    const container =
        document.getElementById(
            "qrcode"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!qrValue) {
        return;
    }


    new QRCode(
        container,
        {
            text: String(qrValue),

            width: 420,

            height: 420,

            correctLevel:
                QRCode.CorrectLevel.H
        }
    );

}


// =====================================================
// LOAD SAVED DATA
// =====================================================

async function loadSavedProduct() {

    if (!SCREEN_BAY) {

        updateConnection(
            "● SET BAY NUMBER"
        );

        return;

    }


    try {

        // First try backend
        const response =
            await fetch(
                `${API}/api/products/${SCREEN_BAY}`
            );


        if (response.ok) {

            const result =
                await response.json();


            if (
                result.success &&
                result.data
            ) {

                displayProduct(
                    result.data
                );

                return;

            }

        }

    } catch (error) {

        console.warn(
            "[SECONDARY] Backend product load failed",
            error
        );

    }


    // Fallback to local storage
    try {

        const saved =
            localStorage.getItem(
                `secondaryBay_${formatBayNo(SCREEN_BAY)}`
            );


        if (saved) {

            displayProduct(
                JSON.parse(saved)
            );

        }

    } catch (error) {

        console.error(
            "[STORAGE RESTORE ERROR]",
            error
        );

    }

}


// =====================================================
// CLEAR DISPLAY
// =====================================================

function clearDisplay() {

    document.getElementById(
        "bayNo"
    ).textContent = "---";


    document.getElementById(
        "orderId"
    ).textContent = "-";


    document.getElementById(
        "qrData"
    ).textContent = "-";


    document.getElementById(
        "qrcode"
    ).innerHTML = "";

}


// =====================================================
// CONNECTION TEXT
// =====================================================

function updateConnection(
    text
) {

    const element =
        document.getElementById(
            "connection"
        );


    if (element) {

        element.textContent =
            text;

    }

}