const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
var cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();
        // Send a ping to confirm a successful connection
        //  await client.db("admin").command({ ping: 1 });
        const db = client.db("layer_DB");
        const usersCollection = db.collection("user");
        const layerCollection = db.collection("lawyers");
        const layerProfileCollection = db.collection("lawyerProfiles");
        const hiringCollection = db.collection("hiring");
        //    profile create update get
        app.get("/api/lawyerProfile/:email", async (req, res) => {
            try {
                const email = req.params.email;
                //console.log("email", email);
                const result = await layerProfileCollection.findOne({
                    lawyerEmail: email,
                });
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.post("/api/lawyerProfile", async (req, res) => {
            try {
                const Mypro = req.body;
                const result = await layerProfileCollection.insertOne({
                    ...Mypro,
                    status: "pending",
                });
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.patch("/api/lawyerProfile/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const updatePro = req.body;
                const result = await layerProfileCollection.updateOne(
                    {
                        lawyerEmail: email,
                    },
                    {
                        $set: { ...updatePro },
                    },
                );
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.get("/api/lawyer/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const result = await layerCollection
                    .find({ lawyerEmail: email })
                    .toArray();
                res.json(result);
            } catch (error) {}
        });
        app.get("/api/lawyers/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await layerCollection.findOne({
                    _id: new ObjectId(id),
                });
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.post("/api/lawyer", async (req, res) => {
            try {
                const service = req.body;
                const lawyer = await usersCollection.findOne({
                    email: service?.lawyerEmail,
                });
                const lawyerServiceCount = await layerCollection.countDocuments(
                    { lawyerEmail: service?.lawyerEmail },
                );
                if (!lawyer?.isPremium && lawyerServiceCount >= 3) {
                    return res.status(401).send({
                        message: "Your free limit is over",
                    });
                }
                const result = await layerCollection.insertOne(service);
                res.json(result);
            } catch (error) {}
        });
        app.patch("/api/lawyer/:id", async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id);

                const data = req.body;
                console.log(data);
                const result = await layerCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { ...data } },
                );
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.delete("/api/lawyer/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const dltData = req.body;
                const result = await layerCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        // browse all lawyer service
        app.get("/api/lawyers", async (req, res) => {
            try {
                const category = req.query.category;
                const search = req.query.search;
                const query = {};
                if (search) {
                    query.title = { $regex: search, $options: "i" };
                }
                if (category) {
                    query.category = category;
                    //  query.category={$in:category.split(",")}
                }

                const cursor = await layerCollection.find(query);
                const result = await cursor.toArray();
                res.json(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.patch("/api/users/update-premium/:email", async (req, res) => {
            const email = req.params.email;

            const result = await usersCollection.updateOne(
                { email },
                { $set: { isPremium: true } },
            );
            res.json(result);
        });
        app.get("/api/hirings/lawyer/:email", async (req, res) => {
            const email = req.params.email;
            // console.log(req.params);
            const result = await hiringCollection
                .find({ serviceEmail: email })
                .toArray();
            res.json(result);
        });
        app.get("/api/hirings/client/:email", async (req, res) => {
            const email = req.params.email;

            const result = await hiringCollection
                .find({ clientEmail: email })
                .toArray();

            res.json(result);
        });
        app.post("/api/hirings", async (req, res) => {
            const {
                clientEmail,
                clientId,
                serviceEmail,
                serviceId,
                serviceTitle,
                consultationFee,
                category,
                transactionId,
            } = req.body;
            const hireingData = {
                clientEmail,
                clientId,
                serviceEmail,
                serviceId,
                serviceTitle,
                consultationFee,
                transactionId,
                category,
                serviceTitle,
                status: "pending",
                paymentStatus: "unpaid",
                hiringDate: new Date(),
            };

            //  const isHiringExist = await layerCollection.updateOne({
            //      serviceId,
            //  }{$set{status}});
            // if (isHiringExist) {
            //     return res.status(409).send({ message: "Already Paid" });
            // }

            const result = await hiringCollection.insertOne({ ...hireingData });
            //console.log(result);
            res.json(result);
            // const lawyerRes = await layerCollection.updateOne(
            //     { _id: new ObjectId(serviceId) },
            //     { $set: { status: "accepet" } },
            // );
            // console.log({ lawyerRes });
            // res.json({ success: true, message: "Lawyer hire successfull" });
        });

        app.patch("/api/hirings/accept/:id", async (req, res) => {
            const id = req.params.id;

            console.log("id", id);
            const data = req.body;
            const result = await hiringCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...data } },
            );
            res.json(result);
        });
        app.patch("/api/hirings/reject/:id", async (req, res) => {
            const id = req.params.id;

            console.log("id", id);
            const data = req.body;
            const result = await hiringCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...data } },
            );
            res.json(result);
        });


        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!",
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
