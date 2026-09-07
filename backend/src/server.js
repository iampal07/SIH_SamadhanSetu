require('dotenv').config();
const express = require('express');
const cors = require('cors');
const complaintsRouter = require('./routes/complaints');

const app = express();
app.use(cors());
app.use(express.json());

// Mount the router
app.use('/complaints', complaintsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
