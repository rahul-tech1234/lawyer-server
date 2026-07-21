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
                const service = req.body;
                const result = await layerCollection
                    .find({ lawyerEmail: email })
                    .toArray();
                res.json(result);
            } catch (error) {}
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
                console.log("id", id);
                const data = res.body;
                const result = await layerCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { ...data } },
                );
            } catch (error) {
                console.log(error);
            }
        });
        // app.delete("/api/lawyer/:id", async (req, res) => {
        //     try {
        //         const id = req.params.id;

        //         const dltData = req.body;
        //         const result = await layerCollection.deleteOne({
        //             _id: new ObjectId(id),
        //         });

        //         res.json(result);
        //     } catch (error) {
        //         console.log(error);
        //     }
        // });
        // browse all lawyer service
        app.get("/api/allService", async (req, res) => {
            const search = req.query.search;
            const category = req.query.category;
            const serviceName = req.query.serviceName;
            const query = {};
            if (search) {
                query.title = {
                    $regex: search,
                    $option: "i",
                };
            }
            if (category) {
                // query.category=category;
                query.category={$in:category.split(",")}
            }
            if (serviceName) {
                query.serviceName=serviceName;
            }
            const cursor = await layerCollection.find();
            const result = await cursor.toArray();
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
