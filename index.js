const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// ----------
// middleware

app.use(cors());
app.use(express.json());


// --------
// mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ylmkwmz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    // --------------
    // database intro

    const toysCollection = client.db("toySafari").collection("toys");
    // creating index
    // const indexKeys = { toyName: 1 };
    // const indexOptions = { name: "toy" };
    // await toysCollection.createIndex(indexKeys, indexOptions);

    // -------
    // routers

    app.get('/toys', async (req, res) => {
      const result = await toysCollection.find().limit(20).toArray();
      res.send(result);
    });
    // https://toy-safari-server.vercel.app/toys


    app.get('/toys/:category', async (req, res) => {
      const category = req.params.category;
      const query = { subCategory: { $regex: new RegExp(`^${category}$`, 'i') } };
      const result = await toysCollection.find(query);
      res.send(result);
      // console.log(category);
    })
    // https://toy-safari-server.vercel.app/toys/

    app.get('/searchToys/:text', async (req, res) => {
      const searchedText = req.params.text;
      const result = await toysCollection.find({
        toyName: { $regex: searchedText, $options: "i" }
      }).toArray();
      res.send(result);
    })
    // https://toy-safari-server.vercel.app/searchToys/

    app.get('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/myToys', async (req, res) => {
      const sort = req.query.sort;
      const order = req.query.order;
      let result = [];
      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email }
      }
      if (sort === 'false' && order === 'false') {
        result = await toysCollection.find(query).limit(20).toArray();
        console.log(1);
        res.send(result)
      }
      else if (sort === 'true' && order === 'true') {
        result = await toysCollection.find(query).sort({ price: -1 }).limit(20).toArray();
        console.log(2, false, true);
        res.send(result)
      }
      else if (sort === 'true' && order === 'false') {
        result = await toysCollection.find(query).sort({ price: 1 }).limit(20).toArray();
        console.log(3);
        res.send(result);
      }
      // console.log(result);
    })

    app.put('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const toy = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateToy = {
        $set: {
          toyName: toy.toyName,
          subCategory: toy.subCategory,
          price: toy.price,
          availableQuantity: toy.availableQuantity,
          pictureURL: toy.pictureURL,
          rating: toy.rating,
          description: toy.description
        }
      }
      const result = await toysCollection.updateOne(filter, updateToy, options);
      res.send(result);
    })

    app.post('/addToy', async (req, res) => {
      const toy = req.body;
      console.log(toy);
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    })

    app.delete('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('toy is running');
})

app.listen(port, () => {
  console.log(`toy running on port: ${port}`);
})