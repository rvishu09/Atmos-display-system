const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const net = require("net");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());

const PORT = 5000;

const EXCEL_PATH = path.join(
    __dirname,
    "data",
    "bays.xlsx"
);
// =====================================================
// FLC PRODUCT STORAGE
// =====================================================

const PRODUCT_FILE =
    path.join(
        __dirname,
        "data",
        "products.json"
    );


let currentProducts = {};


// Create data directory if required

const dataDirectory =
    path.dirname(
        PRODUCT_FILE
    );


if (!fs.existsSync(dataDirectory)) {

    fs.mkdirSync(
        dataDirectory,
        {
            recursive: true
        }
    );

}


// Load saved products

if (
    fs.existsSync(
        PRODUCT_FILE
    )
) {

    try {

        currentProducts =
            JSON.parse(
                fs.readFileSync(
                    PRODUCT_FILE,
                    "utf8"
                )
            );

        console.log(
            "[FLC] Products loaded"
        );

    }

    catch (error) {

        console.error(
            "[FLC] Unable to load products",
            error
        );

        currentProducts = {};

    }

}


// Save products

function saveProducts() {

    fs.writeFileSync(

        PRODUCT_FILE,

        JSON.stringify(
            currentProducts,
            null,
            2
        ),

        "utf8"

    );

}


// =====================================================
// TCP CONNECTION STORAGE
// =====================================================

const tcpConnections = {};


// =====================================================
// READ EXCEL
// =====================================================

function readExcel() {

    try {

        const workbook = XLSX.readFile(EXCEL_PATH);

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        return data;

    } catch (error) {

        console.error(
            "Excel read error:",
            error.message
        );

        return [];

    }
}


// =====================================================
// GET ALL BAYS
// =====================================================

app.get("/api/bays", (req, res) => {

    const bays = readExcel();

    res.json({
        success: true,
        data: bays
    });

});

// =====================================================
// FIND BAY USING IP ADDRESS
// =====================================================

// GET ALL FLC PRODUCTS
app.get("/api/products", (req, res) => {

    res.json({
        success: true,
        data: currentProducts
    });

});


// ================================================
// ADD / UPDATE FLC PRODUCT
// ================================================

app.put("/api/products/:bayNo", (req, res) => {

    try {

        const bayNo = String(req.params.bayNo);

        const {
            wayNo,
            serialNo,
            product,
            model,
            qrValue,
            ipAddress
        } = req.body;


        const productData = {

            bayNo: bayNo,

            wayNo: wayNo || "",

            serialNo: serialNo || "",

            product: product || "",

            model: model || "",

            qrValue: qrValue || "",

            ipAddress: ipAddress || "",

            updatedAt: new Date().toISOString()

        };


        // Save product in memory
        currentProducts[bayNo] = productData;


        // Save product to products.json
        saveProducts();


        // Send real-time update
        io.emit(
            "product-updated",
            productData
        );


        console.log(
            "[FLC UPDATED]",
            productData
        );


        res.json({

            success: true,

            message: "Product saved successfully",

            data: productData

        });

    }

    catch (error) {

        console.error(
            "[FLC UPDATE ERROR]",
            error
        );


        res.status(500).json({

            success: false,

            message: error.message

        });

    }

});
app.delete(
    "/api/products/:bayNo",
    (req, res) => {

        try {

            const bayNo =
                String(
                    req.params.bayNo
                );


            if (
                !currentProducts[bayNo]
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Product not found"

                });

            }


            delete currentProducts[
                bayNo
            ];


            saveProducts();


            io.emit(
                "product-deleted",
                {
                    bayNo: bayNo
                }
            );


            console.log(
                `[FLC DELETED] Bay ${bayNo}`
            );


            res.json({

                success: true,

                message:
                    `Bay ${bayNo} deleted`

            });

        }

        catch (error) {

            console.error(
                "[FLC DELETE ERROR]",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);

// =====================================================
// GET SINGLE BAY
// =====================================================

app.get("/api/bays/:bayNo", (req, res) => {

    const bayNo = String(req.params.bayNo);

    const bays = readExcel();

    const bay = bays.find(item =>

        String(item["Bay No"]) === bayNo

    );


    if (!bay) {

        return res.status(404).json({

            success: false,

            message: "Bay not found"

        });

    }


    res.json({

        success: true,

        data: bay

    });

});
// =====================================================
// UPDATE BAY CONFIGURATION
// =====================================================

app.put(
    "/api/bays/:bayNo",
    (req, res) => {

        try {

            const bayNo =
                String(req.params.bayNo);


            const {
                wayNo,
                ipAddress,
                tcpPort
            } = req.body;


            // =========================================
            // VALIDATION
            // =========================================

            if (
                !ipAddress ||
                !tcpPort
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "IP Address and TCP Port are required"

                });

            }


            const port =
                Number(tcpPort);


            if (
                !Number.isInteger(port) ||
                port < 1 ||
                port > 65535
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid TCP Port"

                });

            }


            // =========================================
            // READ CURRENT EXCEL
            // =========================================

            const workbook =
                XLSX.readFile(
                    EXCEL_PATH
                );


            const sheetName =
                workbook.SheetNames[0];


            const sheet =
                workbook.Sheets[
                    sheetName
                ];


            const bays =
                XLSX.utils.sheet_to_json(
                    sheet
                );


            // =========================================
            // FIND BAY
            // =========================================

            const bay =
                bays.find(
                    item =>
                        String(
                            item["Bay No"]
                        ) === bayNo
                );


            if (!bay) {

                return res.status(404).json({

                    success: false,

                    message:
                        `Bay ${bayNo} not found`

                });

            }


            // =========================================
            // UPDATE VALUES
            // =========================================

            bay["Way No"] =
                wayNo;


            bay["IP Address"] =
                String(ipAddress).trim();


            bay["TCP Port"] =
                port;


            // =========================================
            // WRITE BACK TO EXCEL
            // =========================================

            const newSheet =
                XLSX.utils.json_to_sheet(
                    bays
                );


            workbook.Sheets[
                sheetName
            ] =
                newSheet;


            XLSX.writeFile(
                workbook,
                EXCEL_PATH
            );


            console.log("");

            console.log(
                "================================"
            );

            console.log(
                `[BAY UPDATED] Bay ${bayNo}`
            );

            console.log(
                `Way No    : ${wayNo}`
            );

            console.log(
                `IP        : ${ipAddress}`
            );

            console.log(
                `TCP Port  : ${port}`
            );

            console.log(
                "================================"
            );


            // =========================================
            // CLOSE OLD TCP CONNECTION
            // =========================================

            if (
                tcpConnections[bayNo]
            ) {

                try {

                    tcpConnections[
                        bayNo
                    ].destroy();

                }

                catch (error) {}

                delete tcpConnections[
                    bayNo
                ];

            }


            // =========================================
            // CREATE UPDATED CONFIG
            // =========================================

            const updatedBay = {

                ...bay,

                "Bay No":
                    bayNo,

                "Way No":
                    wayNo,

                "IP Address":
                    String(ipAddress).trim(),

                "TCP Port":
                    port

            };


            // =========================================
            // PUBLISH UPDATE TO ALL BROWSERS
            // =========================================

            io.emit(
                "bay-config-updated",
                updatedBay
            );


            // =========================================
            // RECONNECT BAY
            // =========================================

            setTimeout(
                () => {

                    connectToBay(
                        updatedBay
                    );

                },
                300
            );


            res.json({

                success: true,

                message:
                    `Bay ${bayNo} updated and published`,

                data:
                    updatedBay

            });

        }

        catch (error) {

            console.error(
                "[BAY UPDATE ERROR]",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);


// =====================================================
// TCP DATA PARSER
// =====================================================

function parseTCPData(rawData, bayConfig) {

    const data = rawData.trim();

    console.log("");
    console.log("================================");
    console.log("RAW TCP DATA");
    console.log("================================");
    console.log(data);
    console.log("================================");


    if (!data) {

        return null;

    }


    // -------------------------------------------------
    // 1. JSON
    // -------------------------------------------------

    try {

        const json = JSON.parse(data);

        return normalizeData(json, bayConfig);

    } catch (error) {

        // Not JSON
    }


    // -------------------------------------------------
    // 2. KEY=VALUE
    // Example:
    // serialNo=SN001;bayNo=1;product=AC;model=AC100
    // -------------------------------------------------

    if (data.includes("=")) {

        const result = {};

        const parts = data.split(/[;\n]+/);

        parts.forEach(part => {

            const index = part.indexOf("=");

            if (index === -1) {
                return;
            }

            const key = part
                .substring(0, index)
                .trim();

            const value = part
                .substring(index + 1)
                .trim();

            result[key] = value;

        });


        if (Object.keys(result).length > 0) {

            return normalizeData(
                result,
                bayConfig
            );

        }

    }


    // -------------------------------------------------
    // 3. CSV
    // Example:
    // SN001,1,Air Conditioner,AC300
    // -------------------------------------------------

    if (data.includes(",")) {

        const parts = data
            .split(",")
            .map(item => item.trim());


        if (parts.length >= 4) {

            return normalizeData({

                serialNo: parts[0],

                bayNo: parts[1],

                product: parts[2],

                model: parts[3],

                qrValue: parts[4] || parts[0]

            }, bayConfig);

        }

    }


    // -------------------------------------------------
    // 4. PIPE
    // Example:
    // SN001|1|Air Conditioner|AC300
    // -------------------------------------------------

    if (data.includes("|")) {

        const parts = data
            .split("|")
            .map(item => item.trim());


        if (parts.length >= 4) {

            return normalizeData({

                serialNo: parts[0],

                bayNo: parts[1],

                product: parts[2],

                model: parts[3],

                qrValue: parts[4] || parts[0]

            }, bayConfig);

        }

    }


    // -------------------------------------------------
    // Unknown format
    // -------------------------------------------------

    return {

        bayNo: bayConfig["Bay No"],

        ipAddress: bayConfig["IP Address"],

        rawData: data,

        dataFormat: "UNKNOWN"

    };

}


// =====================================================
// NORMALIZE DATA
// =====================================================

function normalizeData(data, bayConfig) {

    const result = {

        wayNo:
            data.wayNo ??
            data.WayNo ??
            data["Way No"] ??
            bayConfig["Way No"],

        bayNo:
            data.bayNo ??
            data.BayNo ??
            data["Bay No"] ??
            bayConfig["Bay No"],

        serialNo:
            data.serialNo ??
            data.SerialNo ??
            data["Serial No"] ??
            data.serial ??
            "",

        product:
            data.product ??
            data.Product ??
            "",

        model:
            data.model ??
            data.Model ??
            "",

        qrValue:
            data.qrValue ??
            data.QRValue ??
            data["QR Value"] ??
            data.serialNo ??
            data.SerialNo ??
            "",

        ipAddress:
            bayConfig["IP Address"],

        tcpPort:
            bayConfig["TCP Port"]

    };

    return result;
}

// =====================================================
// CONNECT TO TCP DEVICE
// =====================================================

function connectToBay(bayConfig) {

    const bayNo = String(
        bayConfig["Bay No"]
    );

    const ipAddress =
        String(bayConfig["IP Address"]);


    const tcpPort =
        Number(bayConfig["TCP Port"]);


    console.log("");
    console.log("================================");
    console.log("TCP CONNECTION");
    console.log("================================");

    console.log(
        `Bay       : ${bayNo}`
    );

    console.log(
        `IP        : ${ipAddress}`
    );

    console.log(
        `TCP Port  : ${tcpPort}`
    );

    console.log("================================");


    // Close existing connection

    if (tcpConnections[bayNo]) {

        try {

            tcpConnections[bayNo].destroy();

        } catch (error) {}

        delete tcpConnections[bayNo];

    }


    const socket = new net.Socket();


    tcpConnections[bayNo] = socket;


    let buffer = "";

    let flushTimer = null;


    // -------------------------------------------------
    // CONNECT
    // -------------------------------------------------

    socket.connect(
        tcpPort,
        ipAddress,
        () => {

            console.log(
                `[TCP] Bay ${bayNo} connected`
            );


            io.emit("tcp-status", {

                bayNo: bayNo,

                connected: true,

                ipAddress: ipAddress,

                port: tcpPort

            });


            // Optional request to device

            const request =
                bayConfig["Request"];


            if (
                request &&
                String(request).trim() !== ""
            ) {

                console.log(
                    `[TCP] Sending request: ${request}`
                );


                socket.write(
                    String(request)
                );

            }

        }
    );


    // -------------------------------------------------
    // RECEIVE DATA
    // -------------------------------------------------

    socket.on("data", (chunk) => {

        const text =
            chunk.toString("utf8");


        console.log(
            `[TCP] Data received from Bay ${bayNo}:`,
            text
        );


        buffer += text;


        // ---------------------------------------------
        // Try newline-separated messages first
        // ---------------------------------------------

        const lines =
            buffer.split(/\r?\n/);


        if (lines.length > 1) {

            buffer = lines.pop();


            lines.forEach(line => {

                if (!line.trim()) {
                    return;
                }


                processTCPMessage(
                    line,
                    bayConfig
                );

            });

        }


        // ---------------------------------------------
        // Some devices don't send newline.
        // Process after 200ms of no additional data.
        // ---------------------------------------------

        clearTimeout(flushTimer);


        flushTimer = setTimeout(() => {

            if (buffer.trim()) {

                processTCPMessage(
                    buffer,
                    bayConfig
                );

                buffer = "";

            }

        }, 200);

    });


    // -------------------------------------------------
    // ERROR
    // -------------------------------------------------

    socket.on("error", (error) => {

        console.error(
            `[TCP] Bay ${bayNo} error:`,
            error.message
        );


        io.emit("tcp-status", {

            bayNo: bayNo,

            connected: false,

            error: error.message

        });

    });


    // -------------------------------------------------
    // CLOSE
    // -------------------------------------------------
socket.on("close", () => {

    console.log(
        `[TCP] Bay ${bayNo} connection closed`
    );

    io.emit("tcp-status", {

        bayNo: bayNo,

        connected: false,

        ipAddress: ipAddress,

        port: tcpPort

    });

    delete tcpConnections[bayNo];

    console.log(
        `[TCP] Bay ${bayNo} will reconnect in 5 seconds`
    );

    setTimeout(() => {

        console.log(
            `[TCP] Reconnecting Bay ${bayNo}...`
        );

        connectToBay(bayConfig);

    }, 5000);

});


    // -------------------------------------------------
    // TIMEOUT
    // -------------------------------------------------

    socket.setTimeout(10000);


    socket.on("timeout", () => {

        console.log(
            `[TCP] Bay ${bayNo} timeout`
        );

        socket.destroy();

    });

}


// =====================================================
// PROCESS TCP MESSAGE
// =====================================================

function processTCPMessage(
    message,
    bayConfig
) {

    const product =
        parseTCPData(
            message,
            bayConfig
        );


    if (!product) {

        return;

    }


    console.log("");
    console.log(
        `[TCP] Parsed Bay ${bayConfig["Bay No"]}`
    );

    console.log(product);


    // Send to every connected browser

    io.emit(
        "product-data",
        product
    );

}


// =====================================================
// CONNECT API
// =====================================================

app.post(
    "/api/bays/:bayNo/connect",
    (req, res) => {

        const bayNo =
            String(req.params.bayNo);


        const bays =
            readExcel();


        const bay =
            bays.find(item =>

                String(item["Bay No"]) === bayNo

            );


        if (!bay) {

            return res.status(404).json({

                success: false,

                message: "Bay not found in Excel"

            });

        }


        if (
            !bay["IP Address"] ||
            !bay["TCP Port"]
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bay IP Address or TCP Port missing"

            });

        }


        connectToBay(bay);


        res.json({

            success: true,

            message:
                `TCP connection started for Bay ${bayNo}`,

            data: bay

        });

    }
);


// =====================================================
// DISCONNECT API
// =====================================================

app.post(
    "/api/bays/:bayNo/disconnect",
    (req, res) => {

        const bayNo =
            String(req.params.bayNo);


        const socket =
            tcpConnections[bayNo];


        if (socket) {

            socket.destroy();

            delete tcpConnections[bayNo];

        }


        res.json({

            success: true,

            message:
                `Bay ${bayNo} disconnected`

        });

    }
);


// =====================================================
// CONNECTION STATUS
// =====================================================

app.get(
    "/api/bays/:bayNo/status",
    (req, res) => {

        const bayNo =
            String(req.params.bayNo);


        const socket =
            tcpConnections[bayNo];


        res.json({

            success: true,

            connected:
                !!socket &&
                !socket.destroyed

        });

    }
);

// =====================================================
// DISPLAY PRODUCT TO SECONDARY SCREEN
// =====================================================

app.post("/api/display", (req, res) => {

    const product = req.body;

    console.log(
        "[DISPLAY] Sending product to secondary screen:"
    );

    console.log(product);

    io.emit(
        "display-product",
        product
    );

    res.json({

        success: true,

        message:
            "Product sent to secondary screen"

    });

});




// =====================================================
// SOCKET.IO
// =====================================================

io.on("connection", (socket) => {

    console.log(
        `[Socket.IO] Browser connected: ${socket.id}`
    );


    // Send existing FLC products
    // immediately when browser connects

    socket.emit(
        "products-initial",
        currentProducts
    );


    socket.on("disconnect", () => {

        console.log(
            `[Socket.IO] Browser disconnected: ${socket.id}`
        );

    });

});

// =====================================================
// AUTO CONNECT ALL BAYS
// =====================================================

function connectAllBays() {

    const bays = readExcel();

    console.log("");
    console.log("================================");
    console.log("AUTO CONNECTING ALL BAYS");
    console.log("================================");

    if (!bays.length) {

        console.log("No Bays found in Excel");

        return;
    }

    bays.forEach((bay, index) => {

        const bayNo = bay["Bay No"];
        const ipAddress = bay["IP Address"];
        const tcpPort = bay["TCP Port"];

        console.log(
            `[AUTO CONNECT] Bay ${bayNo} -> ${ipAddress}:${tcpPort}`
        );

        if (!ipAddress || !tcpPort) {

            console.log(
                `[SKIP] Bay ${bayNo} missing IP or TCP Port`
            );

            return;
        }

        // Small delay between connections
        setTimeout(() => {

            connectToBay(bay);

        }, index * 500);

    });

}





// =====================================================
// START SERVER
// =====================================================

server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("     FACTORY DISPLAY SYSTEM");
    console.log("================================");

    console.log(
        `HTTP Server : http://localhost:${PORT}`
    );

    console.log(
        `TCP Support : ENABLED`
    );

    console.log("================================");
    console.log("");

    // Automatically connect to all Bays
   // connectAllBays();

});