const socket = io("http://192.168.0.135:5000");


// =====================================================
// CONNECTION
// =====================================================

socket.on("connect", () => {

    console.log(
        "Secondary screen connected"
    );

    updateConnection(
        "● CONNECTED"
    );

});


socket.on("disconnect", () => {

    console.log(
        "Secondary screen disconnected"
    );

    updateConnection(
        "● DISCONNECTED"
    );

});


// =====================================================
// TCP STATUS
// =====================================================

socket.on(
    "tcp-status",
    async data => {

        console.log(
            "TCP STATUS:",
            data
        );

        if (data.connected) {

            updateConnection(
                `● BAY ${data.bayNo} CONNECTED`
            );

            // =========================================
            // LOAD PRODUCT SAVED FOR THIS BAY
            // =========================================

            try {

                const response = await fetch(
                    `http://192.168.0.135:5000/api/products/${data.bayNo}`
                );

                const result = await response.json();

                console.log(
                    "[SECONDARY] PRODUCT FROM BAY:",
                    result
                );

                if (
                    result.success &&
                    result.data
                ) {

                    displayProduct(
                        result.data
                    );

                } else {

                    console.log(
                        `[SECONDARY] No product saved for Bay ${data.bayNo}`
                    );

                }

            } catch (error) {

                console.error(
                    "[SECONDARY] Product loading error:",
                    error
                );

            }

        } else {

            updateConnection(
                "● BAY DISCONNECTED"
            );

        }

    }
);

// =====================================================
// RECEIVE PRODUCT FROM TCP
// =====================================================

socket.on(
    "product-data",
    product => {

        console.log(
            "PRODUCT RECEIVED:",
            product
        );


        displayProduct(
            product
        );

    }
);


// =====================================================
// DISPLAY PRODUCT
// =====================================================

function displayProduct(product) {

    console.log(
        "[SECONDARY DISPLAY PRODUCT]",
        product
    );


    const bayNo =
        document.getElementById("bayNo");

    const productElement =
        document.getElementById("product");

    const model =
        document.getElementById("model");

    const ipAddress =
        document.getElementById("ipAddress");


    // Bay Number
    if (bayNo) {
        bayNo.textContent =
            product.bayNo || "-";
    }


    // Product
    if (productElement) {
        productElement.textContent =
            product.product || "-";
    }


    // Model
    if (model) {
        model.textContent =
            product.model || "-";
    }


    // IP Address
    if (ipAddress) {
        ipAddress.textContent =
            product.ipAddress || "-";
    }


    // QR Code
    generateQR(product);

}


// =====================================================
// FLC REAL-TIME UPDATE
// =====================================================

socket.on(
    "product-updated",
    product => {

        console.log(
            "[FLC REAL-TIME UPDATE]",
            product
        );


        displayProduct(
            product
        );


        updateConnection(
            `● BAY ${product.bayNo} UPDATED`
        );

    }
);


// =====================================================
// FLC REAL-TIME DELETE
// =====================================================

socket.on(
    "product-deleted",
    data => {

        console.log(
            "[FLC REAL-TIME DELETE]",
            data
        );


        const currentBay =
            document.getElementById(
                "bayNo"
            ).textContent;


        // Clear only if this screen
        // is showing the deleted bay

        if (
            String(currentBay) ===
            String(data.bayNo)
        ) {

            clearSecondaryDisplay();

        }

    }
);





// =====================================================
// GENERATE QR
// QR CONTAINS ONLY QR VALUE
// =====================================================

function generateQR(
    product
) {

    const container =
        document.getElementById(
            "qrcode"
        );


    container.innerHTML = "";


    // ONLY QR DATA

    const qrData =
        product.qrValue || "";


    if (!qrData) {

        console.warn(
            "[QR] No QR Value"
        );

        return;

    }


    console.log(
        "[QR] Data:",
        qrData
    );


    new QRCode(
        container,
        {

            text:
                String(
                    qrData
                ),

            width:
                300,

            height:
                300,

            correctLevel:
                QRCode.CorrectLevel.H

        }
    );

}


// =====================================================
// CLEAR SECONDARY DISPLAY
// =====================================================

function clearSecondaryDisplay() {

    const bayNo =
        document.getElementById("bayNo");

    const product =
        document.getElementById("product");

    const model =
        document.getElementById("model");

    const ipAddress =
        document.getElementById("ipAddress");

    const qrcode =
        document.getElementById("qrcode");


    if (bayNo) {
        bayNo.textContent = "-";
    }

    if (product) {
        product.textContent = "-";
    }

    if (model) {
        model.textContent = "-";
    }

    if (ipAddress) {
        ipAddress.textContent = "-";
    }

    if (qrcode) {
        qrcode.innerHTML = "";
    }


    updateConnection(
        "● WAITING"
    );

}


// =====================================================
// CONNECTION DISPLAY
// =====================================================

function updateConnection(
    text
) {

    document.getElementById(
        "connection"
    ).textContent =
        text;

}