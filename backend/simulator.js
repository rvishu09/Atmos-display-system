const net = require("net");

// =====================================================
// FACTORY DEVICE SIMULATOR
// =====================================================

const bays = [
    {
        bayNo: 1,
        wayNo: 21,
        port: 6001,
        product: "Washing Machine",
        model: "WM100"
    },
    {
        bayNo: 2,
        wayNo: 22,
        port: 6002,
        product: "Refrigerator",
        model: "RF200"
    },
    {
        bayNo: 3,
        wayNo: 23,
        port: 6003,
        product: "Air Conditioner",
        model: "AC300"
    },
    {
        bayNo: 4,
        wayNo: 24,
        port: 6004,
        product: "Microwave Oven",
        model: "MW400"
    },
    {
        bayNo: 5,
        wayNo: 25,
        port: 6005,
        product: "Dishwasher",
        model: "DW500"
    }
];


// =====================================================
// CREATE EACH BAY SIMULATOR
// =====================================================

bays.forEach((bay) => {

    const server = net.createServer((socket) => {

        console.log("");
        console.log("================================");
        console.log(`BAY ${bay.bayNo} CONNECTED`);
        console.log("================================");

        // Function to send product data
        function sendProduct() {

            const serialNo =
                `BAY${bay.bayNo}-` + Date.now();

            const response = JSON.stringify({

                wayNo: bay.wayNo,

                bayNo: bay.bayNo,

                serialNo: serialNo,

                product: bay.product,

                model: bay.model,

                qrValue: serialNo

            });

            console.log(
                `[BAY ${bay.bayNo}] Sending product: ${serialNo}`
            );

            socket.write(response + "\n");
        }


        // Send immediately
        sendProduct();


        // Send new product every 5 seconds
        const interval = setInterval(() => {

            if (!socket.destroyed) {
                sendProduct();
            }

        }, 5000);


        // Client disconnected
        socket.on("close", () => {

            clearInterval(interval);

            console.log(
                `[BAY ${bay.bayNo}] Connection closed`
            );

        });


        socket.on("error", (error) => {

            clearInterval(interval);

            console.log(
                `[BAY ${bay.bayNo}] Error: ${error.message}`
            );

        });

    });


    server.on("error", (error) => {

        console.log(
            `[BAY ${bay.bayNo}] Server error: ${error.message}`
        );

    });


    server.listen(
        bay.port,
        "127.0.0.1",
        () => {

            console.log(
                `[SIMULATOR] Bay ${bay.bayNo} running on 127.0.0.1:${bay.port}`
            );

        }
    );

});