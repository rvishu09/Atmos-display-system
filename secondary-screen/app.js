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
    data => {

        console.log(
            "TCP STATUS:",
            data
        );


        if (data.connected) {

            updateConnection(
                `● BAY ${data.bayNo} CONNECTED`
            );

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

socket.on(
    "display-product",
    product => {

        console.log(
            "DISPLAY PRODUCT:",
            product
        );


        displayProduct(
            product
        );

    }
);


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
// UPDATE SCREEN
// =====================================================

function displayProduct(
    product
) {

    document.getElementById(
        "bayNo"
    ).textContent =
        product.bayNo || "-";


    document.getElementById(
        "serialNo"
    ).textContent =
        product.serialNo || "-";


    document.getElementById(
        "product"
    ).textContent =
        product.product || "-";


    document.getElementById(
        "model"
    ).textContent =
        product.model || "-";


    document.getElementById(
        "ipAddress"
    ).textContent =
        product.ipAddress || "-";


    // Generate QR
    generateQR(
        product
    );

}


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

    document.getElementById(
        "bayNo"
    ).textContent =
        "-";


    document.getElementById(
        "serialNo"
    ).textContent =
        "-";


    document.getElementById(
        "product"
    ).textContent =
        "-";


    document.getElementById(
        "model"
    ).textContent =
        "-";


    document.getElementById(
        "ipAddress"
    ).textContent =
        "-";


    document.getElementById(
        "qrcode"
    ).innerHTML =
        "";


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