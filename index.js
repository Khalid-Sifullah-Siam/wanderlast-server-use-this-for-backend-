const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');


const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

 const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )


const verifyToken = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }      
    
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }  
    
    try{
        const {payload} = await jwtVerify(token, JWKS)
        next()
    }
    catch(error){
        return res.status(403).json({ message: 'Forbidden' });
    }


}



async function run() {
  try {
   
    await client.connect();

    const db = client.db('wanderlast');
    const destinationsCollection = db.collection('destinations');
    const bookingsCollection = db.collection('bookings');


    // Add destination
    app.post('/destinations',verifyToken, async (req, res) => {
        const destinationData = req.body;
        const result = await destinationsCollection.insertOne(destinationData);
        res.json(result);
    });


    // add booking destination
    app.post('/booking', verifyToken, async (req, res) => {
        const bookingData = req.body;
        const result = await bookingsCollection.insertOne(bookingData);
        res.json(result);
    });







    // get all destinations
    app.get('/destinations', async (req, res) => {
        const cursor = destinationsCollection.find();
        const destinations = await cursor.toArray();
        res.json(destinations);
    });


    // get featured destinations
    app.get('/featured-destinations', async (req, res) => {
        const cursor = destinationsCollection.find();
        const destinations = await cursor.limit(4).toArray();
        res.json(destinations);
    });


    // get destination by id
    app.get('/destination/:id',verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const destination = await destinationsCollection.findOne(query);
        res.json(destination);
    });


    // get all booking by userId
    app.get('/bookings/:userId', verifyToken, async (req, res) => {
        const userId = req.params.userId;
        const query = { userId: userId };
        const bookings = await bookingsCollection.find(query).toArray();
        res.json(bookings);
    });


    // Update destination by id
    app.patch('/destination/:id',verifyToken, async (req, res) => {
        const id = req.params.id;
        const updatedData = req.body;
        const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
    $set: updatedData
};
        const result = await destinationsCollection.updateOne(filter, updatedDoc);
        res.json(result);
    });
    



    // delete destination by id
    app.delete('/destination/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await destinationsCollection.deleteOne(query);
        res.json(result);
    })


    // delete booking destination by destinationId
    app.delete('/booking/:_id',verifyToken, async (req, res) => {
        const _id = req.params._id;
        const query = { _id: new ObjectId(_id) };
        const result = await bookingsCollection.deleteOne(query);
        res.json(result);
    })
    



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})